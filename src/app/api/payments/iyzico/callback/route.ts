import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  retrieveIyzicoDonation,
  retrieveIyzicoSubscription,
} from "~/server/payments/iyzico";
import { recomputeUserPlan } from "~/server/payments/sync";

export const runtime = "nodejs";

const callbackQuerySchema = z.object({
  kind: z.enum(["subscription", "donation"]),
  reference: z.string().cuid(),
});

export async function POST(request: Request) {
  const url = new URL(request.url);
  const query = callbackQuerySchema.safeParse({
    kind: url.searchParams.get("kind"),
    reference: url.searchParams.get("reference"),
  });
  if (!query.success) {
    return NextResponse.json({ error: "Invalid callback" }, { status: 400 });
  }
  const formData = await request.formData();
  const token = z.string().min(1).safeParse(formData.get("token"));
  if (!token.success) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  const origin = env.APP_DOMAIN.replace(/\/$/, "");

  if (query.data.kind === "donation") {
    const result = await retrieveIyzicoDonation(
      token.data,
      query.data.reference,
    );
    const data = result.data ?? result;
    const paid = data.paymentStatus === "SUCCESS";
    await db.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: query.data.reference },
      });
      if (!donation) return;
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          status: paid ? "PAID" : "FAILED",
          providerSessionId: token.data,
          providerPaymentId: data.paymentId,
          ...(paid ? { paidAt: new Date() } : {}),
        },
      });
      await tx.paymentTransaction.upsert({
        where: {
          provider_providerTransactionId: {
            provider: "IYZICO",
            providerTransactionId: data.paymentId ?? token.data,
          },
        },
        create: {
          userId: donation.userId,
          provider: "IYZICO",
          kind: "DONATION",
          providerTransactionId: data.paymentId ?? token.data,
          providerSessionId: token.data,
          amount: donation.amount,
          currency: donation.currency,
          status: paid ? "SUCCEEDED" : "FAILED",
        },
        update: {
          status: paid ? "SUCCEEDED" : "FAILED",
          providerSessionId: token.data,
        },
      });
    });
    return NextResponse.redirect(
      `${origin}/support/${paid ? "success" : "?checkout=failed"}`,
      303,
    );
  }

  const result = await retrieveIyzicoSubscription(token.data);
  const data = result.data ?? result;
  const subscriptionReferenceCode = data.subscriptionReferenceCode;
  if (!subscriptionReferenceCode) {
    return NextResponse.redirect(`${origin}/pricing?checkout=failed`, 303);
  }
  await db.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: {
        provider_providerSubscriptionId: {
          provider: "IYZICO",
          providerSubscriptionId: subscriptionReferenceCode,
        },
      },
      create: {
        userId: query.data.reference,
        provider: "IYZICO",
        providerCustomerId: data.customerReferenceCode,
        providerSubscriptionId: subscriptionReferenceCode,
        status: "ACTIVE",
      },
      update: {
        providerCustomerId: data.customerReferenceCode,
        status: "ACTIVE",
      },
    });
    await tx.user.update({
      where: { id: query.data.reference },
      data: {
        iyzicoCustomerReferenceCode: data.customerReferenceCode,
        iyzicoSubscriptionReferenceCode: subscriptionReferenceCode,
      },
    });
    await recomputeUserPlan(tx, query.data.reference);
    await tx.paymentTransaction.upsert({
      where: {
        provider_providerTransactionId: {
          provider: "IYZICO",
          providerTransactionId: subscriptionReferenceCode,
        },
      },
      create: {
        userId: query.data.reference,
        provider: "IYZICO",
        kind: "SUBSCRIPTION",
        providerTransactionId: subscriptionReferenceCode,
        providerSessionId: token.data,
        status: "SUCCEEDED",
      },
      update: { status: "SUCCEEDED", providerSessionId: token.data },
    });
  });
  return NextResponse.redirect(
    `${origin}/pricing/success?provider=iyzico`,
    303,
  );
}
