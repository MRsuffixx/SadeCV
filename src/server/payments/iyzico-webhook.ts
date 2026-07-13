import { createHmac, timingSafeEqual } from "node:crypto";

export type IyzicoWebhookPayload = {
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

function signatureMatches(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual.trim().toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "utf8");
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function iyzicoWebhookMessage(
  payload: IyzicoWebhookPayload,
  secretKey: string,
  configuredMerchantId?: string,
) {
  const eventType = payload.iyziEventType ?? payload.eventType ?? "";
  if (!eventType) return null;

  if (eventType.startsWith("subscription.")) {
    const merchantId = payload.merchantId ?? configuredMerchantId;
    if (
      !merchantId ||
      !payload.subscriptionReferenceCode ||
      !payload.orderReferenceCode ||
      !payload.customerReferenceCode
    ) {
      return null;
    }
    return (
      merchantId +
      secretKey +
      eventType +
      payload.subscriptionReferenceCode +
      payload.orderReferenceCode +
      payload.customerReferenceCode
    );
  }

  if (
    !payload.paymentConversationId ||
    !payload.status ||
    (!payload.paymentId && payload.iyziPaymentId === undefined)
  ) {
    return null;
  }
  return payload.token
    ? secretKey +
        eventType +
        String(payload.iyziPaymentId ?? "") +
        payload.token +
        payload.paymentConversationId +
        payload.status
    : secretKey +
        eventType +
        String(payload.paymentId ?? "") +
        payload.paymentConversationId +
        payload.status;
}

export function verifyIyzicoWebhookSignature(
  payload: IyzicoWebhookPayload,
  signature: string,
  secretKey: string,
  merchantId?: string,
) {
  const message = iyzicoWebhookMessage(payload, secretKey, merchantId);
  if (!message) return false;
  const expected = createHmac("sha256", secretKey)
    .update(message, "utf8")
    .digest("hex");
  return signatureMatches(signature, expected);
}
