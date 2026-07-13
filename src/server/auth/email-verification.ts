import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { env } from "~/env";
import { db } from "~/server/db";

const TOKEN_PREFIX = "email-verification:";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1_000;

function tokenHash(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function localEmailDevelopment() {
  const hostname = new URL(env.APP_DOMAIN).hostname;
  return (
    env.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1", "::1"].includes(hostname)
  );
}

export function canDeliverVerificationEmail() {
  if (localEmailDevelopment()) return true;
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

async function deliver(email: string, verificationUrl: string) {
  if (localEmailDevelopment() && (!env.RESEND_API_KEY || !env.EMAIL_FROM)) {
    console.info(`Development email verification URL: ${verificationUrl}`);
    return { sent: true, developmentUrl: verificationUrl };
  }
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return { sent: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [email],
        subject: "Verify your SadeCV email",
        text: `Verify your SadeCV email by opening this link within 24 hours: ${verificationUrl}`,
        html: `<p>Welcome to SadeCV.</p><p><a href="${escapeHtml(verificationUrl)}">Verify your email</a> within 24 hours.</p><p>If you did not create this account, you can ignore this message.</p>`,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
}

export async function issueEmailVerification(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const token = randomBytes(32).toString("base64url");
  const identifier = `${TOKEN_PREFIX}${normalizedEmail}`;
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await db.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({ where: { identifier } });
    await tx.verificationToken.create({
      data: { identifier, token: tokenHash(token), expires },
    });
  });

  const url = new URL("/api/auth/verify-email", env.APP_DOMAIN);
  url.searchParams.set("token", token);
  return deliver(normalizedEmail, url.toString());
}

export async function consumeEmailVerification(token: string) {
  const hash = tokenHash(token);
  return db.$transaction(async (tx) => {
    const verification = await tx.verificationToken.findUnique({
      where: { token: hash },
    });
    if (!verification?.identifier.startsWith(TOKEN_PREFIX)) {
      return false;
    }
    if (verification.expires <= new Date()) {
      await tx.verificationToken.delete({ where: { token: hash } });
      return false;
    }

    const email = verification.identifier.slice(TOKEN_PREFIX.length);
    const updated = await tx.user.updateMany({
      where: { email },
      data: { emailVerified: new Date() },
    });
    await tx.verificationToken.deleteMany({
      where: { identifier: verification.identifier },
    });
    return updated.count === 1;
  });
}
