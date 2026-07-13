import "server-only";

import type Stripe from "stripe";

import type { Prisma, PrismaClient } from "../../../generated/prisma";
import { getStripe } from "~/server/payments/stripe";
import { TEMPLATE_DEFINITIONS } from "~/templates/registry";

const ACTIVE_STATUSES = ["ACTIVE", "TRIALING"];
const PREMIUM_TEMPLATE_IDS = TEMPLATE_DEFINITIONS.filter(
  (template) => template.isPremium,
).map((template) => template.id);

export async function recomputeUserPlan(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { bannedAt: true },
  });
  if (!user) return;

  const active = user.bannedAt
    ? null
    : await tx.subscription.findFirst({
        where: {
          userId,
          status: { in: ACTIVE_STATUSES },
          OR: [
            { currentPeriodEnd: null },
            { currentPeriodEnd: { gt: new Date() } },
          ],
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      });
  await tx.user.update({
    where: { id: userId },
    data: active
      ? {
          tier: "PREMIUM",
          tierStatus: active.status,
          tierExpiresAt: active.currentPeriodEnd,
        }
      : { tier: "FREE", tierStatus: "INACTIVE", tierExpiresAt: null },
  });
  if (!active) {
    await tx.resume.updateMany({
      where: {
        userId,
        template: { in: PREMIUM_TEMPLATE_IDS },
        isPublic: true,
      },
      data: { isPublic: false, status: "DRAFT" },
    });
  }
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

  const storedSubscription = await tx.subscription.upsert({
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
      providerCustomerId: customerId,
      status,
      currentPeriodEnd: stripePeriodEnd(subscription),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
  await tx.user.update({
    where: { id: storedSubscription.userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    },
  });
  await recomputeUserPlan(tx, storedSubscription.userId);
}

export async function processStripeEvent(
  tx: Prisma.TransactionClient,
  event: Stripe.Event,
) {
  const eventId = `STRIPE:${event.id}`;
  const existingEvent = await tx.paymentEvent.findUnique({
    where: { id: eventId },
    select: { status: true },
  });
  if (existingEvent?.status === "PROCESSED") return;
  if (existingEvent) {
    await tx.paymentEvent.update({
      where: { id: eventId },
      data: {
        type: event.type,
        status: "PROCESSING",
        attempts: { increment: 1 },
        errorMessage: null,
        processedAt: null,
      },
    });
  } else {
    await tx.paymentEvent.create({
      data: {
        id: eventId,
        provider: "STRIPE",
        type: event.type,
        status: "PROCESSING",
      },
    });
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncStripeSubscription(tx, event.data.object);
  } else if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object;
    const failed = event.type === "checkout.session.async_payment_failed";
    const kind = session.metadata?.kind?.toUpperCase() ?? "CHECKOUT";
    const transactionId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? session.id);
    await tx.paymentTransaction.upsert({
      where: {
        provider_providerTransactionId: {
          provider: "STRIPE",
          providerTransactionId: transactionId,
        },
      },
      create: {
        userId:
          session.metadata?.userId ?? session.client_reference_id ?? undefined,
        provider: "STRIPE",
        kind,
        providerTransactionId: transactionId,
        providerSessionId: session.id,
        amount: session.amount_total,
        currency: session.currency?.toUpperCase(),
        status: failed
          ? "FAILED"
          : session.payment_status === "paid"
            ? "SUCCEEDED"
            : "PENDING",
      },
      update: {
        providerSessionId: session.id,
        status: failed
          ? "FAILED"
          : session.payment_status === "paid"
            ? "SUCCEEDED"
            : "PENDING",
      },
    });
    if (session.metadata?.kind === "donation") {
      const donationId = session.metadata.donationId;
      if (donationId && failed) {
        await tx.donation.updateMany({
          where: { id: donationId, status: { not: "PAID" } },
          data: { status: "FAILED", providerSessionId: session.id },
        });
      }
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
    } else if (
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

  await tx.paymentEvent.update({
    where: { id: eventId },
    data: { status: "PROCESSED", processedAt: new Date() },
  });
}

export async function reconcileExpiredPlans(
  db: PrismaClient,
  now = new Date(),
) {
  const cutoff = new Date(now.getTime() - 15 * 60 * 1_000);
  const stale = await db.subscription.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      currentPeriodEnd: { lte: cutoff },
    },
    select: { id: true, userId: true },
    take: 500,
  });
  const userIds = [...new Set(stale.map((item) => item.userId))];

  const result = await db.$transaction(async (tx) => {
    const subscriptions = stale.length
      ? await tx.subscription.updateMany({
          where: { id: { in: stale.map((item) => item.id) } },
          data: { status: "EXPIRED" },
        })
      : { count: 0 };
    for (const userId of userIds) await recomputeUserPlan(tx, userId);

    const abandonedDonations = await tx.donation.updateMany({
      where: {
        status: "PENDING",
        createdAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1_000) },
      },
      data: { status: "FAILED" },
    });
    const expiredCheckouts = await tx.paymentCheckout.updateMany({
      where: { status: "PENDING", expiresAt: { lte: now } },
      data: { status: "FAILED", consumedAt: now },
    });
    await tx.rateLimitBucket.deleteMany({
      where: {
        resetAt: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1_000) },
      },
    });
    return {
      subscriptions: subscriptions.count,
      users: userIds.length,
      abandonedDonations: abandonedDonations.count,
      expiredCheckouts: expiredCheckouts.count,
    };
  });

  return result;
}
