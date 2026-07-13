import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "~/app/_components/brand";
import { PricingCheckout } from "~/app/pricing/_components/pricing-checkout";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const session = await auth();
  return (
    <main className="min-h-screen bg-[#f3f4ef]">
      <header className="border-b border-black/[0.07] bg-[#fafaf7]/90 backdrop-blur-xl">
        <div className="site-container flex h-[72px] items-center justify-between">
          <Brand />
          <div className="flex items-center gap-2">
            <Link
              href="/support"
              className="hidden px-3 py-2 text-sm font-bold text-[#59625e] sm:block"
            >
              Support
            </Link>
            <Link
              href={session ? "/dash" : "/auth/login"}
              className="button-secondary min-h-10 px-4 text-xs"
            >
              {session ? "Dashboard" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>
      <section className="site-container py-16 sm:py-24">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="eyebrow text-[#277b67]">Simple plans, serious craft</p>
          <h1 className="mt-5 font-serif text-5xl tracking-[-0.05em] text-[#123f35] sm:text-7xl">
            Choose your pace.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#65706a]">
            Start thoughtfully for free. Upgrade when opportunities move faster
            than a monthly limit.
          </p>
        </div>
        <PricingCheckout
          authenticated={Boolean(session)}
          email={session?.user?.email ?? undefined}
        />
      </section>
    </main>
  );
}
