import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "~/app/auth/_components/auth-shell";
import { ResendVerificationForm } from "~/app/auth/verify-email/_components/resend-form";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell
      title="Check your inbox."
      subtitle="Verify your email before signing in. Verification links expire after 24 hours and can only be used once."
      footer={
        <Link
          href="/auth/login"
          className="font-bold text-[#1f6755] hover:underline"
        >
          Return to sign in
        </Link>
      }
    >
      {params.sent === "1" ? (
        <p className="rounded-xl border border-[#277b67]/20 bg-[#e9f5ef] px-4 py-3 text-sm font-semibold text-[#1e6453]">
          If the address can receive mail, a verification link is on its way.
        </p>
      ) : null}
      <ResendVerificationForm email={params.email} />
    </AuthShell>
  );
}
