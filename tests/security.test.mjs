import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  isTurkey,
  isValidBillingIdentity,
  isValidTurkishIdentityNumber,
} from "../src/lib/identity.ts";
import { isAllowedResumeImageUrl } from "../src/lib/remote-assets.ts";
import { includesNormalizedSearch } from "../src/lib/search.ts";
import {
  iyzicoWebhookMessage,
  verifyIyzicoWebhookSignature,
} from "../src/server/payments/iyzico-webhook.ts";

function hmac(message, secret) {
  return createHmac("sha256", secret).update(message, "utf8").digest("hex");
}

test("validates Turkish identity numbers and international passports", () => {
  assert.equal(isTurkey("Türkiye"), true);
  assert.equal(isValidTurkishIdentityNumber("10000000146"), true);
  assert.equal(isValidTurkishIdentityNumber("10000000145"), false);
  assert.equal(isValidBillingIdentity("10000000146", "TR"), true);
  assert.equal(isValidBillingIdentity("P 1234567", "Germany"), true);
  assert.equal(isValidBillingIdentity("x", "Germany"), false);
});

test("allows only configured HTTPS resume image hosts", () => {
  assert.equal(isAllowedResumeImageUrl("https://utfs.io/f/avatar.png"), true);
  assert.equal(
    isAllowedResumeImageUrl("https://tenant.ufs.sh/f/avatar.png"),
    true,
  );
  assert.equal(isAllowedResumeImageUrl("http://utfs.io/f/avatar.png"), false);
  assert.equal(isAllowedResumeImageUrl("http://169.254.169.254/latest"), false);
  assert.equal(isAllowedResumeImageUrl("https://localhost/avatar.png"), false);
});

test("normalizes Turkish and accented admin search text", () => {
  assert.equal(includesNormalizedSearch(["Meriç Yılmaz"], "MERIC"), true);
  assert.equal(includesNormalizedSearch(["Işık"], "isik"), true);
  assert.equal(includesNormalizedSearch(["Çağla"], "cag"), true);
});

test("verifies iyzico subscription webhook signatures", () => {
  const secret = "secret-key";
  const payload = {
    merchantId: "merchant-1",
    iyziEventType: "subscription.order.success",
    subscriptionReferenceCode: "subscription-1",
    orderReferenceCode: "order-1",
    customerReferenceCode: "customer-1",
  };
  const message = iyzicoWebhookMessage(payload, secret);
  assert.equal(
    message,
    "merchant-1secret-keysubscription.order.successsubscription-1order-1customer-1",
  );
  assert.equal(
    verifyIyzicoWebhookSignature(payload, hmac(message, secret), secret),
    true,
  );
  assert.equal(verifyIyzicoWebhookSignature(payload, "00", secret), false);
});

test("uses the correct canonical message for direct and hosted payments", () => {
  const secret = "secret-key";
  const direct = {
    iyziEventType: "payment.success",
    paymentId: "payment-1",
    paymentConversationId: "conversation-1",
    status: "SUCCESS",
  };
  const hosted = {
    ...direct,
    paymentId: undefined,
    iyziPaymentId: "payment-2",
    token: "checkout-token",
  };
  const directMessage = iyzicoWebhookMessage(direct, secret);
  const hostedMessage = iyzicoWebhookMessage(hosted, secret);
  assert.equal(
    directMessage,
    "secret-keypayment.successpayment-1conversation-1SUCCESS",
  );
  assert.equal(
    hostedMessage,
    "secret-keypayment.successpayment-2checkout-tokenconversation-1SUCCESS",
  );
  assert.equal(
    verifyIyzicoWebhookSignature(
      hosted,
      hmac(hostedMessage, secret),
      secret,
    ),
    true,
  );
});
