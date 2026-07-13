"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "~/server/db";
import { signIn } from "~/server/auth";
import { rateLimit } from "~/server/security/rate-limit";
import { getClientIp, verifyTurnstile } from "~/server/security/turnstile";

export type AuthActionState = {
  error?: string;
};

export async function googleAuthAction(formData: FormData) {
  const token = String(formData.get("turnstileToken") ?? "");
  const requestHeaders = await headers();
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

  const requestHeaders = await headers();
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

  try {
    await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      },
    });
  } catch {
    return { error: "We couldn't create your account. Please try again." };
  }

  redirect("/auth/login?registered=1");
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
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
