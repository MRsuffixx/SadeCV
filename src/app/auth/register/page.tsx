import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "~/app/auth/_components/auth-form";
import { AuthShell } from "~/app/auth/_components/auth-shell";
import { env } from "~/env";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await auth()) redirect("/dash");

  return (
    <AuthShell
      title="Start with your story."
      subtitle="Create a secure workspace for CVs that are clear, considered, and distinctly yours."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-[#1f6755] hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <AuthForm
        mode="register"
        googleEnabled={Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET)}
      />
    </AuthShell>
  );
}
