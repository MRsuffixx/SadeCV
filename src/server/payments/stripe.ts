import "server-only";

import Stripe from "stripe";

import { env } from "~/env";

let stripeClient: Stripe | undefined;

export function isStripeSubscriptionConfigured() {
  return Boolean(
    env.STRIPE_SECRET_KEY &&
    env.STRIPE_WEBHOOK_SECRET &&
    env.STRIPE_PREMIUM_PRICE_ID,
  );
}

export function isStripeDonationConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured.");
  }
  stripeClient ??= new Stripe(env.STRIPE_SECRET_KEY, {
    appInfo: { name: "SadeCV", version: "0.2.0" },
  });
  return stripeClient;
}

export async function createStripeSubscriptionCheckout(input: {
  userId: string;
  email: string;
  customerId?: string | null;
}) {
  if (!env.STRIPE_PREMIUM_PRICE_ID) {
    throw new Error("Stripe premium price is not configured.");
  }
  const stripe = getStripe();
  const origin = env.APP_DOMAIN.replace(/\/$/, "");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...(input.customerId
      ? { customer: input.customerId }
      : { customer_email: input.email }),
    client_reference_id: input.userId,
    line_items: [{ price: env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata: { kind: "subscription", userId: input.userId },
    subscription_data: {
      metadata: { kind: "subscription", userId: input.userId },
    },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url, sessionId: session.id };
}

export async function createStripeDonationCheckout(input: {
  donationId: string;
  userId?: string;
  email?: string;
  amount: number;
  currency: string;
}) {
  const stripe = getStripe();
  const origin = env.APP_DOMAIN.replace(/\/$/, "");
  const metadata = {
    kind: "donation",
    donationId: input.donationId,
    ...(input.userId ? { userId: input.userId } : {}),
  };
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      submit_type: "donate",
      customer_email: input.email,
      client_reference_id: input.userId ?? input.donationId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amount,
            product_data: {
              name: "Support SadeCV",
              description:
                "A one-time contribution to independent development.",
            },
          },
        },
      ],
      success_url: `${origin}/support/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/support?checkout=cancelled`,
      metadata,
      payment_intent_data: { metadata },
    },
    { idempotencyKey: `donation:${input.donationId}` },
  );
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url, sessionId: session.id };
}
