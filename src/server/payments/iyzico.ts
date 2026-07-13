import "server-only";

import { createHash } from "node:crypto";

import Iyzipay from "iyzipay";

import { env } from "~/env";

export type IyzicoBillingProfile = {
  name: string;
  surname: string;
  identityNumber: string;
  gsmNumber: string;
  email: string;
  address: string;
  city: string;
  district: string;
  country: string;
  zipCode: string;
};

export type IyzicoResult = {
  status?: string;
  errorMessage?: string;
  conversationId?: string;
  token?: string;
  paymentPageUrl?: string;
  checkoutFormContent?: string;
  paymentId?: string;
  paymentStatus?: string;
  referenceCode?: string;
  subscriptionReferenceCode?: string;
  subscriptionStatus?: string;
  customerReferenceCode?: string;
  tokenExpireTime?: number;
  endDate?: number;
  data?: {
    status?: string;
    token?: string;
    paymentPageUrl?: string;
    checkoutFormContent?: string;
    referenceCode?: string;
    subscriptionReferenceCode?: string;
    subscriptionStatus?: string;
    customerReferenceCode?: string;
    paymentId?: string;
    paymentStatus?: string;
    endDate?: number;
  };
};

let iyzicoClient: Iyzipay | undefined;

export function isIyzicoConfigured() {
  return Boolean(
    env.IYZICO_API_KEY &&
    env.IYZICO_SECRET_KEY &&
    env.IYZICO_BASE_URL &&
    env.IYZICO_PREMIUM_PLAN_REFERENCE_CODE,
  );
}

export function isIyzicoDonationConfigured() {
  return Boolean(
    env.IYZICO_API_KEY && env.IYZICO_SECRET_KEY && env.IYZICO_BASE_URL,
  );
}

export function getIyzico() {
  if (!env.IYZICO_API_KEY || !env.IYZICO_SECRET_KEY || !env.IYZICO_BASE_URL) {
    throw new Error("iyzico is not configured.");
  }
  iyzicoClient ??= new Iyzipay({
    apiKey: env.IYZICO_API_KEY,
    secretKey: env.IYZICO_SECRET_KEY,
    uri: env.IYZICO_BASE_URL,
  });
  return iyzicoClient;
}

export function iyzicoTokenHash(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function checkoutExpiry(seconds?: number) {
  const lifetime = Math.min(3_600, Math.max(300, seconds ?? 1_800));
  return new Date(Date.now() + lifetime * 1_000);
}

function invoke(
  operation: (callback: (error: Error | null, result: unknown) => void) => void,
) {
  return new Promise<IyzicoResult>((resolve, reject) => {
    operation((error, result) => {
      if (error) return reject(error);
      const response = result as IyzicoResult;
      if (response.status !== "success") {
        return reject(
          new Error(response.errorMessage ?? "iyzico request failed."),
        );
      }
      resolve(response);
    });
  });
}

function customer(profile: IyzicoBillingProfile) {
  const address = {
    contactName: `${profile.name} ${profile.surname}`,
    city: profile.city,
    district: profile.district,
    country: profile.country,
    address: profile.address,
    zipCode: profile.zipCode,
  };
  return {
    name: profile.name,
    surname: profile.surname,
    identityNumber: profile.identityNumber,
    email: profile.email,
    gsmNumber: profile.gsmNumber,
    billingAddress: address,
    shippingAddress: address,
  };
}

export async function createIyzicoSubscriptionCheckout(input: {
  userId: string;
  profile: IyzicoBillingProfile;
}) {
  if (!env.IYZICO_PREMIUM_PLAN_REFERENCE_CODE) {
    throw new Error("iyzico premium plan is not configured.");
  }
  const origin = env.APP_DOMAIN.replace(/\/$/, "");
  const client = getIyzico();
  const response = await invoke((callback) =>
    client.subscriptionCheckoutForm.initialize(
      {
        locale: "en",
        conversationId: input.userId,
        callbackUrl: `${origin}/api/payments/iyzico/callback`,
        pricingPlanReferenceCode: env.IYZICO_PREMIUM_PLAN_REFERENCE_CODE,
        subscriptionInitialStatus: "ACTIVE",
        customer: customer(input.profile),
      },
      callback,
    ),
  );
  const data = response.data ?? response;
  const token = data.token ?? response.token;
  if (!token) throw new Error("iyzico did not return a checkout token.");
  return {
    token,
    url: data.paymentPageUrl ?? response.paymentPageUrl ?? null,
    checkoutFormContent:
      data.checkoutFormContent ?? response.checkoutFormContent ?? null,
    expiresAt: checkoutExpiry(response.tokenExpireTime),
  };
}

export async function createIyzicoDonationCheckout(input: {
  donationId: string;
  amount: number;
  ip: string;
  profile: IyzicoBillingProfile;
}) {
  const origin = env.APP_DOMAIN.replace(/\/$/, "");
  const client = getIyzico();
  const price = (input.amount / 100).toFixed(2);
  const buyer = {
    id: input.donationId,
    name: input.profile.name,
    surname: input.profile.surname,
    gsmNumber: input.profile.gsmNumber,
    email: input.profile.email,
    identityNumber: input.profile.identityNumber,
    registrationAddress: input.profile.address,
    ip: input.ip,
    city: input.profile.city,
    country: input.profile.country,
    zipCode: input.profile.zipCode,
  };
  const address = {
    contactName: `${input.profile.name} ${input.profile.surname}`,
    city: input.profile.city,
    district: input.profile.district,
    country: input.profile.country,
    address: input.profile.address,
    zipCode: input.profile.zipCode,
  };
  const response = await invoke((callback) =>
    client.checkoutFormInitialize.create(
      {
        locale: "en",
        conversationId: input.donationId,
        price,
        paidPrice: price,
        currency: "TRY",
        basketId: input.donationId,
        paymentGroup: "PRODUCT",
        callbackUrl: `${origin}/api/payments/iyzico/callback`,
        enabledInstallments: [1],
        buyer,
        shippingAddress: address,
        billingAddress: address,
        basketItems: [
          {
            id: input.donationId,
            name: "Support SadeCV",
            category1: "Digital services",
            itemType: "VIRTUAL",
            price,
          },
        ],
      },
      callback,
    ),
  );
  const data = response.data ?? response;
  const token = data.token ?? response.token;
  const url = data.paymentPageUrl ?? response.paymentPageUrl;
  if (!token || !url) {
    throw new Error("iyzico did not return a hosted checkout URL.");
  }
  return {
    token,
    url,
    expiresAt: checkoutExpiry(response.tokenExpireTime),
  };
}

export async function retrieveIyzicoSubscription(token: string) {
  const client = getIyzico();
  return invoke((callback) =>
    client.subscriptionCheckoutForm.retrieve(
      { checkoutFormToken: token },
      callback,
    ),
  );
}

export async function retrieveIyzicoDonation(token: string, reference: string) {
  const client = getIyzico();
  return invoke((callback) =>
    client.checkoutForm.retrieve(
      { locale: "en", conversationId: reference, token },
      callback,
    ),
  );
}
