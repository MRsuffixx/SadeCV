import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";
import { getStripe } from "~/server/payments/stripe";
import {
  parseIyzicoEpochDate,
  retrieveIyzicoSubscriptionDetails,
} from "~/server/payments/iyzico";
import {
  verifyIyzicoWebhookSignature,
  type IyzicoWebhookPayload,
} from "~/server/payments/iyzico-webhook";
import { processStripeEvent, recomputeUserPlan } from "~/server/payments/sync";

export const runtime = "nodejs";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function subscriptionRecord(
  result: Awaited<ReturnType<typeof retrieveIyzicoSubscriptionDetails>>,
  referenceCode: string,
) {
  const data = result.data;
  return (
    data?.items?.find(
      (item) =>
        item.referenceCode === referenceCode ||
        item.subscriptionReferenceCode === referenceCode,
    ) ??
    (data?.referenceCode === referenceCode ||
    data?.subscriptionReferenceCode === referenceCode
      ? data
      : null)
  );
}

async function handleIyzico(rawBody: string, signature: string) {
  let payload: IyzicoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as IyzicoWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (
    !env.IYZICO_SECRET_KEY ||
    !verifyIyzicoWebhookSignature(
      payload,
      signature,
      env.IYZICO_SECRET_KEY,
      env.IYZICO_MERCHANT_ID,
    )
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const eventType = payload.iyziEventType ?? payload.eventType ?? "unknown";
  const eventId =
    payload.iyziReferenceCode ??
    createHash("sha256").update(rawBody).digest("hex");
  const paymentEventId = `IYZICO:${eventId}`;
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");

  try {
    const providerSubscriptionId = payload.subscriptionReferenceCode;
    const authoritativeSubscription = providerSubscriptionId
      ? subscriptionRecord(
          await retrieveIyzicoSubscriptionDetails(providerSubscriptionId),
          providerSubscriptionId,
        )
      : null;

    if (eventType.startsWith("subscription.")) {
      if (!providerSubscriptionId) {
        throw new Error("IYZICO_SUBSCRIPTION_REFERENCE_MISSING");
      }
      if (!authoritativeSubscription?.subscriptionStatus) {
        throw new Error("IYZICO_SUBSCRIPTION_RETRIEVE_FAILED");
      }
    }

    await db.$transaction(async (tx) => {
      const existingEvent = await tx.paymentEvent.findUnique({
        where: { id: paymentEventId },
        select: { status: true },
      });
      if (existingEvent?.status === "PROCESSED") return;
      if (existingEvent) {
        await tx.paymentEvent.update({
          where: { id: paymentEventId },
          data: {
            type: eventType,
            payloadHash,
            status: "PROCESSING",
            attempts: { increment: 1 },
            errorMessage: null,
            processedAt: null,
          },
        });
      } else {
        await tx.paymentEvent.create({
          data: {
            id: paymentEventId,
            provider: "IYZICO",
            type: eventType,
            payloadHash,
            status: "PROCESSING",
          },
        });
      }

      if (eventType.startsWith("subscription.")) {
        const existing = await tx.subscription.findUnique({
          where: {
            provider_providerSubscriptionId: {
              provider: "IYZICO",
              providerSubscriptionId: providerSubscriptionId!,
            },
          },
        });
        if (!existing) {
          throw new Error("IYZICO_SUBSCRIPTION_NOT_CORRELATED");
        }
        const paymentSucceeded =
          payload.status?.toUpperCase() === "SUCCESS" ||
          eventType.endsWith(".success");
        await tx.subscription.update({
          where: { id: existing.id },
          data: {
            status:
              authoritativeSubscription!.subscriptionStatus!.toUpperCase(),
            currentPeriodEnd: parseIyzicoEpochDate(
              authoritativeSubscription!.endDate,
            ),
          },
        });
        await tx.paymentTransaction.upsert({
          where: {
            provider_providerTransactionId: {
              provider: "IYZICO",
              providerTransactionId: payload.orderReferenceCode ?? eventId,
            },
          },
          create: {
            userId: existing.userId,
            provider: "IYZICO",
            kind: "SUBSCRIPTION",
            providerTransactionId: payload.orderReferenceCode ?? eventId,
            status: paymentSucceeded ? "SUCCEEDED" : "FAILED",
          },
          update: {
            status: paymentSucceeded ? "SUCCEEDED" : "FAILED",
          },
        });
        await recomputeUserPlan(tx, existing.userId);
        await tx.paymentEvent.update({
          where: { id: paymentEventId },
          data: { status: "PROCESSED", processedAt: new Date() },
        });
        return;
      }

      const donationId = payload.paymentConversationId;
      if (donationId) {
        const donation = await tx.donation.findFirst({
          where: { id: donationId, provider: "IYZICO" },
        });
        if (donation) {
          await tx.donation.update({
            where: { id: donation.id },
            data: {
              status: payload.status === "SUCCESS" ? "PAID" : "FAILED",
              providerPaymentId: String(
                payload.iyziPaymentId ?? payload.paymentId ?? "",
              ),
              ...(payload.status === "SUCCESS" ? { paidAt: new Date() } : {}),
            },
          });
          const transactionId = String(
            payload.iyziPaymentId ?? payload.paymentId ?? eventId,
          );
          await tx.paymentTransaction.upsert({
            where: {
              provider_providerTransactionId: {
                provider: "IYZICO",
                providerTransactionId: transactionId,
              },
            },
            create: {
              userId: donation.userId,
              provider: "IYZICO",
              kind: "DONATION",
              providerTransactionId: transactionId,
              providerSessionId: donation.providerSessionId,
              amount: donation.amount,
              currency: donation.currency,
              status: payload.status === "SUCCESS" ? "SUCCEEDED" : "FAILED",
            },
            update: {
              status: payload.status === "SUCCESS" ? "SUCCEEDED" : "FAILED",
              providerSessionId: donation.providerSessionId,
            },
          });
        } else {
          throw new Error("IYZICO_DONATION_NOT_CORRELATED");
        }
      }
      await tx.paymentEvent.update({
        where: { id: paymentEventId },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    const errorMessage =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "Unknown webhook processing error";
    await db.paymentEvent.upsert({
      where: { id: paymentEventId },
      create: {
        id: paymentEventId,
        provider: "IYZICO",
        type: eventType,
        payloadHash,
        status: "FAILED",
        errorMessage,
        processedAt: new Date(),
      },
      update: {
        type: eventType,
        payloadHash,
        status: "FAILED",
        attempts: { increment: 1 },
        errorMessage,
        processedAt: new Date(),
      },
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
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
      const errorMessage =
        error instanceof Error
          ? error.message.slice(0, 500)
          : "Unknown webhook processing error";
      await db.paymentEvent.upsert({
        where: { id: `STRIPE:${event.id}` },
        create: {
          id: `STRIPE:${event.id}`,
          provider: "STRIPE",
          type: event.type,
          status: "FAILED",
          errorMessage,
          processedAt: new Date(),
        },
        update: {
          status: "FAILED",
          attempts: { increment: 1 },
          errorMessage,
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
