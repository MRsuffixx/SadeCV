import "server-only";

import type Stripe from "stripe";

import type { Prisma } from "../../../generated/prisma";
import { getStripe } from "~/server/payments/stripe";

const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"];

export async function recomputeUserPlan(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const active = await tx.subscription.findFirst({
    where: { userId, status: { in: ACTIVE_STATUSES } },
    orderBy: { updatedAt: "desc" },
  });
  await tx.user.update({
    where: { id: userId },
    data: active
      ? {
          tier: "PREMIUM",
          tierStatus: active.status,
          tierExpiresAt: active.currentPeriodEnd,
        }
      : { tier: "FREE", tierStatus: "ACTIVE", tierExpiresAt: null },
  });
}

function stripePeriodEnd(subscription: Stripe.Subscription) {
  const timestamp = Math.max(
    0,
    ...subscription.items.data.map((item) => item.current_period_end),
  );
  return timestamp ? new Date(timestamp * 1_000) : null;
}

function stripeCustomerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

export async function syncStripeSubscription(
  tx: Prisma.TransactionClient,
  subscription: Stripe.Subscription,
  fallbackUserId?: string,
) {
  const userId = subscription.metadata.userId ?? fallbackUserId;
  if (!userId) return;
  const status = subscription.status.toUpperCase();
  const customerId = stripeCustomerId(subscription);

  await tx.subscription.upsert({
    where: {
      provider_providerSubscriptionId: {
        provider: "STRIPE",
        providerSubscriptionId: subscription.id,
      },
    },
    create: {
      userId,
      provider: "STRIPE",
      providerCustomerId: customerId,
      providerSubscriptionId: subscription.id,
      status,
      currentPeriodEnd: stripePeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      userId,
      providerCustomerId: customerId,
      status,
      currentPeriodEnd: stripePeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
  await tx.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    },
  });
  await recomputeUserPlan(tx, userId);
}

export async function processStripeEvent(
  tx: Prisma.TransactionClient,
  event: Stripe.Event,
) {
  await tx.paymentEvent.create({
    data: { id: `STRIPE:${event.id}`, provider: "STRIPE", type: event.type },
  });

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncStripeSubscription(tx, event.data.object);
    return;
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.metadata?.kind === "donation") {
      const donationId = session.metadata.donationId;
      if (donationId && session.payment_status === "paid") {
        await tx.donation.updateMany({
          where: { id: donationId, status: { not: "PAID" } },
          data: {
            status: "PAID",
            providerSessionId: session.id,
            providerPaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id,
            supporterEmail: session.customer_details?.email ?? undefined,
            paidAt: new Date(),
          },
        });
      }
      return;
    }

    if (
      session.metadata?.kind === "subscription" &&
      typeof session.subscription === "string"
    ) {
      const subscription = await getStripe().subscriptions.retrieve(
        session.subscription,
      );
      await syncStripeSubscription(
        tx,
        subscription,
        session.metadata.userId ?? session.client_reference_id ?? undefined,
      );
    }
  }
}
