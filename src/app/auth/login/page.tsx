import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "~/app/auth/_components/auth-form";
import { AuthShell } from "~/app/auth/_components/auth-shell";
import { env } from "~/env";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    registered?: string;
    error?: string;
    verification?: string;
  }>;
}) {
  if (await auth()) redirect("/dash");
  const params = await searchParams;
  const notice =
    params.verification === "success"
      ? "Email verified. You can now sign in."
      : params.verification === "invalid"
        ? "That verification link is invalid or expired. Request a new one below."
        : params.registered === "1"
          ? "Check your inbox and verify your email before signing in."
          : params.error
            ? "Human verification was not completed. Please try again."
            : undefined;

  return (
    <AuthShell
      title="Good to see you."
      subtitle="Sign in to continue shaping your professional story."
      footer={
        <>
          New to SadeCV?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-[#1f6755] hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm
        mode="login"
        notice={notice}
        googleEnabled={Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET)}
      />
      <p className="mt-4 text-center text-xs text-[#75807a]">
        Need a new verification link?{" "}
        <Link
          href="/auth/verify-email"
          className="font-bold text-[#1f6755] hover:underline"
        >
          Resend it
        </Link>
      </p>
    </AuthShell>
  );
}
