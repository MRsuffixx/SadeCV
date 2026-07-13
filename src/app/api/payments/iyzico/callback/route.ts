import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  iyzicoTokenHash,
  IYZICO_SUBSCRIPTION_STATUSES,
  parseIyzicoEpochDate,
  retrieveIyzicoDonation,
  retrieveIyzicoSubscription,
} from "~/server/payments/iyzico";
import { recomputeUserPlan } from "~/server/payments/sync";

export const runtime = "nodejs";

const tokenSchema = z.string().trim().min(16).max(512);
const subscriptionStatusSchema = z.enum(IYZICO_SUBSCRIPTION_STATUSES);

function redirect(path: string) {
  return NextResponse.redirect(
    `${env.APP_DOMAIN.replace(/\/$/, "")}${path}`,
    303,
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = tokenSchema.safeParse(formData.get("token"));
  if (!token.success) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const tokenHash = iyzicoTokenHash(token.data);
  const checkout = await db.paymentCheckout.findUnique({
    where: { tokenHash },
  });
  if (
    !checkout ||
    checkout.provider !== "IYZICO" ||
    checkout.consumedAt ||
    checkout.status !== "PENDING" ||
    checkout.expiresAt <= new Date()
  ) {
    return NextResponse.json(
      { error: "Unknown or expired checkout" },
      { status: 400 },
    );
  }

  if (checkout.kind === "DONATION") {
    const result = await retrieveIyzicoDonation(
      token.data,
      checkout.referenceId,
    );
    if (result.conversationId && result.conversationId !== checkout.referenceId) {
      return NextResponse.json(
        { error: "Checkout correlation failed" },
        { status: 400 },
      );
    }
    const data = result.data ?? result;
    const paid = data.paymentStatus === "SUCCESS";

    await db.$transaction(async (tx) => {
      const claimed = await tx.paymentCheckout.updateMany({
        where: {
          id: checkout.id,
          status: "PENDING",
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          status: paid ? "COMPLETED" : "FAILED",
          consumedAt: new Date(),
        },
      });
      if (!claimed.count) throw new Error("IYZICO_CALLBACK_ALREADY_CONSUMED");

      const donation = await tx.donation.findUnique({
        where: { id: checkout.referenceId },
      });
      if (!donation || donation.provider !== "IYZICO") {
        throw new Error("IYZICO_DONATION_CORRELATION_FAILED");
      }
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          status: paid ? "PAID" : "FAILED",
          providerPaymentId: data.paymentId,
          ...(paid ? { paidAt: new Date() } : {}),
        },
      });
      await tx.paymentTransaction.upsert({
        where: {
          provider_providerTransactionId: {
            provider: "IYZICO",
            providerTransactionId: data.paymentId ?? checkout.id,
          },
        },
        create: {
          userId: donation.userId,
          provider: "IYZICO",
          kind: "DONATION",
          providerTransactionId: data.paymentId ?? checkout.id,
          providerSessionId: checkout.id,
          amount: donation.amount,
          currency: donation.currency,
          status: paid ? "SUCCEEDED" : "FAILED",
        },
        update: {
          status: paid ? "SUCCEEDED" : "FAILED",
          providerSessionId: checkout.id,
        },
      });
    });

    return redirect(paid ? "/support/success" : "/support?checkout=failed");
  }

  if (checkout.kind !== "SUBSCRIPTION") {
    return NextResponse.json({ error: "Invalid checkout kind" }, { status: 400 });
  }

  const result = await retrieveIyzicoSubscription(token.data);
  if (result.conversationId && result.conversationId !== checkout.referenceId) {
    return NextResponse.json(
      { error: "Checkout correlation failed" },
      { status: 400 },
    );
  }
  const data = result.data ?? result;
  const subscriptionReferenceCode =
    data.referenceCode ?? data.subscriptionReferenceCode;
  const parsedStatus = subscriptionStatusSchema.safeParse(
    data.subscriptionStatus?.toUpperCase(),
  );
  if (!subscriptionReferenceCode || !parsedStatus.success) {
    return redirect("/pricing?checkout=failed");
  }

  const subscriptionStatus = parsedStatus.data;
  const active = subscriptionStatus === "ACTIVE";
  await db.$transaction(async (tx) => {
    const claimed = await tx.paymentCheckout.updateMany({
      where: {
        id: checkout.id,
        status: "PENDING",
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        status: active ? "COMPLETED" : "FAILED",
        consumedAt: new Date(),
      },
    });
    if (!claimed.count) throw new Error("IYZICO_CALLBACK_ALREADY_CONSUMED");

    await tx.subscription.upsert({
      where: {
        provider_providerSubscriptionId: {
          provider: "IYZICO",
          providerSubscriptionId: subscriptionReferenceCode,
        },
      },
      create: {
        userId: checkout.referenceId,
        provider: "IYZICO",
        providerCustomerId: data.customerReferenceCode,
        providerSubscriptionId: subscriptionReferenceCode,
        status: subscriptionStatus,
        currentPeriodEnd: parseIyzicoEpochDate(data.endDate),
      },
      update: {
        providerCustomerId: data.customerReferenceCode,
        status: subscriptionStatus,
        currentPeriodEnd: parseIyzicoEpochDate(data.endDate),
      },
    });
    await tx.user.update({
      where: { id: checkout.referenceId },
      data: {
        iyzicoCustomerReferenceCode: data.customerReferenceCode,
        iyzicoSubscriptionReferenceCode: subscriptionReferenceCode,
      },
    });
    await recomputeUserPlan(tx, checkout.referenceId);
    await tx.paymentTransaction.upsert({
      where: {
        provider_providerTransactionId: {
          provider: "IYZICO",
          providerTransactionId: subscriptionReferenceCode,
        },
      },
      create: {
        userId: checkout.referenceId,
        provider: "IYZICO",
        kind: "SUBSCRIPTION",
        providerTransactionId: subscriptionReferenceCode,
        providerSessionId: checkout.id,
        status: active ? "SUCCEEDED" : "FAILED",
      },
      update: {
        status: active ? "SUCCEEDED" : "FAILED",
        providerSessionId: checkout.id,
      },
    });
  });

  return redirect(
    active ? "/pricing/success?provider=iyzico" : "/pricing?checkout=failed",
  );
}
