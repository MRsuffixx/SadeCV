import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Brand } from "~/app/_components/brand";
import { ProfileEditForms } from "~/app/auth/profile/edit/_components/profile-edit-forms";
import { ProfileImageUpload } from "~/app/auth/profile/edit/_components/profile-image-upload";
import { env } from "~/env";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      locale: true,
      image: true,
      passwordHash: true,
      accounts: { where: { provider: "google" }, select: { id: true } },
    },
  });
  if (!user) redirect("/auth/login");

  return (
    <main className="min-h-screen bg-[#f2f3ee]">
      <header className="border-b border-black/[0.07] bg-[#fafaf7]">
        <div className="site-container flex h-[72px] items-center justify-between">
          <Brand />
          <Link
            href="/auth/profile"
            className="button-secondary min-h-10 px-4 text-xs"
          >
            <ArrowLeft size={15} />
            Profile
          </Link>
        </div>
      </header>
      <div className="site-container max-w-3xl py-10 sm:py-14">
        <p className="eyebrow text-[#277b67]">Account settings</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#123f35] sm:text-5xl">
          Your profile, your access.
        </h1>
        <p className="mt-4 mb-9 max-w-2xl text-sm leading-6 text-[#6d7671]">
          Manage the identity shown in your workspace and keep more than one
          secure way to sign in.
        </p>
        <div className="space-y-6">
          <ProfileImageUpload initialUrl={user.image} name={user.name} />
          <ProfileEditForms
          user={{
            name: user.name,
            email: user.email,
            locale: user.locale,
            hasPassword: Boolean(user.passwordHash),
          }}
          googleConnected={user.accounts.length > 0}
          googleEnabled={Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET)}
          />
        </div>
      </div>
    </main>
  );
}
