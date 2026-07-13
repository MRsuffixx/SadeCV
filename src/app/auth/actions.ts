"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Prisma } from "../../../generated/prisma";
import { db } from "~/server/db";
import { signIn } from "~/server/auth";
import {
  canDeliverVerificationEmail,
  issueEmailVerification,
} from "~/server/auth/email-verification";
import { hasTrustedOrigin } from "~/server/security/origin";
import { rateLimit } from "~/server/security/rate-limit";
import { getClientIp, verifyTurnstile } from "~/server/security/turnstile";
import { isFeatureEnabled } from "~/server/system/feature-flags";

export type AuthActionState = {
  error?: string;
  success?: string;
  developmentUrl?: string;
};

async function trustedActionHeaders() {
  const requestHeaders = await headers();
  return hasTrustedOrigin(requestHeaders) ? requestHeaders : null;
}

export async function googleAuthAction(formData: FormData) {
  const rawToken = formData.get("turnstileToken");
  const token = typeof rawToken === "string" ? rawToken : "";
  const requestHeaders = await trustedActionHeaders();
  if (!requestHeaders) redirect("/auth/login?error=origin");
  const ip = getClientIp(requestHeaders);
  const allowed = await rateLimit(`auth:google:${ip}`, {
    limit: 8,
    windowSeconds: 15 * 60,
  });

  if (!allowed || !(await verifyTurnstile(token, ip))) {
    redirect("/auth/login?error=verification");
  }

  await signIn("google", { redirectTo: "/dash" });
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(128)
    .regex(/[a-z]/, "Add a lowercase letter.")
    .regex(/[A-Z]/, "Add an uppercase letter.")
    .regex(/[0-9]/, "Add a number."),
  turnstileToken: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
  turnstileToken: z.string().min(1),
});

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  if (!(await isFeatureEnabled(db, "REGISTRATION"))) {
    return { error: "New registrations are temporarily disabled." };
  }

  if (!canDeliverVerificationEmail()) {
    return { error: "Email verification is not configured." };
  }

  const requestHeaders = await trustedActionHeaders();
  if (!requestHeaders) return { error: "This request could not be verified." };
  const ip = getClientIp(requestHeaders);
  const allowed = await rateLimit(`auth:register:${ip}`, {
    limit: 5,
    windowSeconds: 60 * 60,
  });

  if (!allowed) {
    return { error: "Too many attempts. Please try again later." };
  }

  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return { error: "Human verification expired. Please try again." };
  }

  const existingUser = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existingUser) {
    return { error: "An account already exists for this email." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  let createdEmail: string;
  try {
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
      select: { email: true },
    });
    createdEmail = user.email;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "An account already exists for this email." };
    }
    return { error: "We couldn't create your account. Please try again." };
  }

  const delivery = await issueEmailVerification(createdEmail);
  const destination = new URL("/auth/verify-email", "http://internal");
  destination.searchParams.set("email", createdEmail);
  destination.searchParams.set("sent", delivery.sent ? "1" : "0");
  if (delivery.developmentUrl) {
    destination.searchParams.set("developmentUrl", delivery.developmentUrl);
  }
  redirect(`${destination.pathname}${destination.search}`);
}

export async function resendVerificationAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email().max(254),
      turnstileToken: z.string().min(1),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email address." };
  if (!canDeliverVerificationEmail()) {
    return { error: "Email verification is temporarily unavailable." };
  }

  const requestHeaders = await trustedActionHeaders();
  if (!requestHeaders) return { error: "This request could not be verified." };
  const ip = getClientIp(requestHeaders);
  const allowed = await rateLimit(`auth:resend:${ip}:${parsed.data.email}`, {
    limit: 3,
    windowSeconds: 60 * 60,
  });
  if (!allowed) return { error: "Too many attempts. Please try again later." };
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) {
    return { error: "Human verification expired. Please try again." };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { email: true, emailVerified: true, passwordHash: true },
  });
  const delivery =
    user?.passwordHash && !user.emailVerified
      ? await issueEmailVerification(user.email)
      : null;

  return {
    success:
      "If an unverified account exists for that address, a new link has been sent.",
    ...(delivery?.developmentUrl
      ? { developmentUrl: delivery.developmentUrl }
      : {}),
  };
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  if (!(await trustedActionHeaders())) {
    return { error: "This request could not be verified." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      turnstileToken: parsed.data.turnstileToken,
      redirectTo: "/dash",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Those credentials couldn't be verified." };
    }
    throw error;
  }

  return {};
}
