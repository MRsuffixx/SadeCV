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
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  if (await auth()) redirect("/dash");
  const params = await searchParams;
  const notice =
    params.registered === "1"
      ? "Your account is ready. Sign in to open your workspace."
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
    </AuthShell>
  );
}
