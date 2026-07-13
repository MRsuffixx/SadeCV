import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Link2,
  LogOut,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Brand } from "~/app/_components/brand";
import { signOutAction } from "~/app/auth/profile/actions";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: { select: { provider: true } },
      _count: { select: { resumes: true } },
    },
  });
  if (!user) redirect("/auth/login");

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#f2f3ee]">
      <header className="border-b border-black/[0.07] bg-[#fafaf7]">
        <div className="site-container flex h-[72px] items-center justify-between">
          <Brand />
          <Link href="/dash" className="button-secondary min-h-10 px-4 text-xs">
            <ArrowLeft size={15} />
            Dashboard
          </Link>
        </div>
      </header>
      <div className="site-container py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <aside className="rounded-[1.5rem] bg-[#123f35] p-7 text-white">
            <div className="grid size-20 place-items-center rounded-[1.4rem] bg-[#b8e3d2] text-2xl font-black text-[#123f35]">
              {initials}
            </div>
            <h1 className="mt-6 font-serif text-3xl tracking-[-0.03em]">
              {user.name ?? "SadeCV member"}
            </h1>
            <p className="mt-2 text-sm text-white/55">{user.email}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-[#b8e3d2] uppercase">
                {user.tier} plan
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-white/70 uppercase">
                {user.role}
              </span>
            </div>
            <Link
              href="/auth/profile/edit"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-[#123f35]"
            >
              <Pencil size={16} />
              Edit profile & accounts
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white/65 hover:bg-white/5"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </aside>

          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat
                icon={FileText}
                label="CVs created"
                value={String(user._count.resumes)}
              />
              <Stat
                icon={Link2}
                label="Sign-in methods"
                value={String(
                  user.accounts.length + (user.passwordHash ? 1 : 0),
                )}
              />
              <Stat
                icon={CalendarDays}
                label="Member since"
                value={new Intl.DateTimeFormat("en", {
                  month: "short",
                  year: "numeric",
                }).format(user.createdAt)}
              />
            </div>
            <div className="rounded-[1.5rem] border border-black/[0.07] bg-white p-7">
              <div className="flex items-start gap-4">
                <span className="grid size-11 place-items-center rounded-2xl bg-[#e6f2ed] text-[#23634f]">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold">Account security</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#6c7570]">
                    Sensitive changes require Cloudflare Turnstile verification.
                    Review and manage every available sign-in method from
                    profile settings.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Status
                  label="Email sign-in"
                  value={user.passwordHash ? "Enabled" : "Not configured"}
                />
                <Status
                  label="Google account"
                  value={
                    user.accounts.some(
                      (account) => account.provider === "google",
                    )
                      ? "Connected"
                      : "Not connected"
                  }
                />
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-[#e4f0eb] p-7">
              <h2 className="font-serif text-2xl text-[#123f35]">
                Your story evolves. Your CV can too.
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#63716b]">
                Keep your profile current, then tailor each CV from your
                dashboard for the opportunity in front of you.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-black/[0.07] bg-white p-5">
      <Icon size={17} className="text-[#27705e]" />
      <p className="mt-5 text-2xl font-black text-[#26483e]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#7b837f]">{label}</p>
    </div>
  );
}
function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4f5f1] p-4">
      <p className="text-[10px] font-extrabold tracking-wide text-[#8a918d] uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}
