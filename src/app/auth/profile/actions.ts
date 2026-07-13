"use server";

import { compare, hash } from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth, signIn, signOut } from "~/server/auth";
import { db } from "~/server/db";
import { rateLimit } from "~/server/security/rate-limit";
import { getClientIp, verifyTurnstile } from "~/server/security/turnstile";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

async function authorizeSensitiveAction(token: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again." } as const;

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const allowed = await rateLimit(`profile:${session.user.id}:${ip}`, {
    limit: 12,
    windowSeconds: 15 * 60,
  });

  if (!allowed) return { error: "Too many attempts. Try again later." } as const;
  if (!(await verifyTurnstile(token, ip))) {
    return { error: "Human verification expired. Please try again." } as const;
  }

  return { userId: session.user.id } as const;
}

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      locale: z.enum(["en", "tr"]),
      turnstileToken: z.string().min(1),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return { error: "Check your profile details." };

  const access = await authorizeSensitiveAction(parsed.data.turnstileToken);
  if ("error" in access) return access;

  await db.user.update({
    where: { id: access.userId },
    data: { name: parsed.data.name, locale: parsed.data.locale },
  });

  revalidatePath("/auth/profile");
  revalidatePath("/auth/profile/edit");
  return { success: "Profile updated." };
}

export async function updatePasswordAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = z
    .object({
      currentPassword: z.string().max(128).optional().default(""),
      newPassword: z
        .string()
        .min(10, "Use at least 10 characters.")
        .max(128)
        .regex(/[a-z]/)
        .regex(/[A-Z]/)
        .regex(/[0-9]/),
      turnstileToken: z.string().min(1),
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Use a stronger password." };
  }

  const access = await authorizeSensitiveAction(parsed.data.turnstileToken);
  if ("error" in access) return access;

  const user = await db.user.findUnique({
    where: { id: access.userId },
    select: { passwordHash: true },
  });

  if (!user) return { error: "Account not found." };

  if (
    user.passwordHash &&
    !(await compare(parsed.data.currentPassword, user.passwordHash))
  ) {
    return { error: "Your current password is incorrect." };
  }

  await db.user.update({
    where: { id: access.userId },
    data: { passwordHash: await hash(parsed.data.newPassword, 12) },
  });

  return { success: user.passwordHash ? "Password changed." : "Password added." };
}

export async function linkGoogleAction(formData: FormData) {
  const token = String(formData.get("turnstileToken") ?? "");
  const access = await authorizeSensitiveAction(token);
  if ("error" in access) return;

  await signIn("google", {
    redirectTo: "/auth/profile/edit?linked=1",
  });
}

export async function unlinkGoogleAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const token = String(formData.get("turnstileToken") ?? "");
  const access = await authorizeSensitiveAction(token);
  if ("error" in access) return access;

  const user = await db.user.findUnique({
    where: { id: access.userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { error: "Add a password before disconnecting Google." };
  }

  await db.account.deleteMany({
    where: { userId: access.userId, provider: "google" },
  });

  revalidatePath("/auth/profile/edit");
  return { success: "Google account disconnected." };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

