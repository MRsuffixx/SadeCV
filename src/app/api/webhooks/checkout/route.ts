import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";
import { getStripe } from "~/server/payments/stripe";
import { processStripeEvent, recomputeUserPlan } from "~/server/payments/sync";

export const runtime = "nodejs";

type IyzicoWebhook = {
  merchantId?: string;
  paymentConversationId?: string;
  paymentId?: string;
  iyziPaymentId?: string | number;
  token?: string;
  status?: string;
  iyziReferenceCode?: string;
  iyziEventType?: string;
  eventType?: string;
  subscriptionReferenceCode?: string;
  orderReferenceCode?: string;
  customerReferenceCode?: string;
};

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function signatureMatches(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual.toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "utf8");
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function verifyIyzicoWebhook(payload: IyzicoWebhook, signature: string) {
  if (!env.IYZICO_SECRET_KEY) return false;
  const eventType = payload.iyziEventType ?? payload.eventType ?? "";
  let message: string;

  if (eventType.startsWith("subscription.")) {
    const merchantId = payload.merchantId ?? env.IYZICO_MERCHANT_ID ?? "";
    if (!merchantId) return false;
    message =
      merchantId +
      env.IYZICO_SECRET_KEY +
      eventType +
      (payload.subscriptionReferenceCode ?? "") +
      (payload.orderReferenceCode ?? "") +
      (payload.customerReferenceCode ?? "");
  } else if (payload.token) {
    message =
      env.IYZICO_SECRET_KEY +
      eventType +
      (payload.iyziPaymentId ?? "") +
      payload.token +
      (payload.paymentConversationId ?? "") +
      (payload.status ?? "");
  } else {
    message =
      env.IYZICO_SECRET_KEY +
      eventType +
      (payload.paymentId ?? "") +
      (payload.paymentConversationId ?? "") +
      (payload.status ?? "");
  }
  const expected = createHmac("sha256", env.IYZICO_SECRET_KEY)
    .update(message)
    .digest("hex");
  return signatureMatches(signature, expected);
}

async function handleIyzico(rawBody: string, signature: string) {
  const payload = JSON.parse(rawBody) as IyzicoWebhook;
  if (!verifyIyzicoWebhook(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const eventType = payload.iyziEventType ?? payload.eventType ?? "unknown";
  const eventId =
    payload.iyziReferenceCode ??
    createHash("sha256").update(rawBody).digest("hex");

  try {
    await db.$transaction(async (tx) => {
      await tx.paymentEvent.create({
        data: {
          id: `IYZICO:${eventId}`,
          provider: "IYZICO",
          type: eventType,
          payloadHash: createHash("sha256").update(rawBody).digest("hex"),
          status: eventType.includes("fail") ? "FAILED" : "PROCESSED",
          processedAt: new Date(),
        },
      });

      if (eventType.startsWith("subscription.")) {
        const providerSubscriptionId = payload.subscriptionReferenceCode;
        if (!providerSubscriptionId) return;
        const existing = await tx.subscription.findUnique({
          where: {
            provider_providerSubscriptionId: {
              provider: "IYZICO",
              providerSubscriptionId,
            },
          },
        });
        if (!existing) return;
        await tx.subscription.update({
          where: { id: existing.id },
          data: {
            status: eventType.endsWith(".success") ? "ACTIVE" : "PAST_DUE",
          },
        });
        await recomputeUserPlan(tx, existing.userId);
        return;
      }

      const donationId = payload.paymentConversationId;
      if (donationId) {
        await tx.donation.updateMany({
          where: { id: donationId },
          data: {
            status: payload.status === "SUCCESS" ? "PAID" : "FAILED",
            providerPaymentId: String(
              payload.iyziPaymentId ?? payload.paymentId ?? "",
            ),
            ...(payload.status === "SUCCESS" ? { paidAt: new Date() } : {}),
          },
        });
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const stripeSignature = request.headers.get("stripe-signature");
  if (stripeSignature) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }
    let event;
    try {
      event = getStripe().webhooks.constructEvent(
        rawBody,
        stripeSignature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
      await db.$transaction((tx) => processStripeEvent(tx, event));
      return NextResponse.json({ received: true });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      await db.paymentEvent.upsert({
        where: { id: `STRIPE:${event.id}` },
        create: {
          id: `STRIPE:${event.id}`,
          provider: "STRIPE",
          type: event.type,
          status: "FAILED",
          errorMessage: "Webhook processing failed",
          processedAt: new Date(),
        },
        update: {
          status: "FAILED",
          errorMessage: "Webhook processing failed",
          processedAt: new Date(),
        },
      });
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 },
      );
    }
  }

  const iyzicoSignature = request.headers.get("x-iyz-signature-v3");
  if (iyzicoSignature) return handleIyzico(rawBody, iyzicoSignature);
  return NextResponse.json({ error: "Missing signature" }, { status: 400 });
}
