import { Heart, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "~/app/_components/brand";
import { TipJar } from "~/app/support/_components/tip-jar";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Support the developer" };

export default async function SupportPage() {
  const session = await auth();
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f3ec]">
      <header className="border-b border-black/[0.07] bg-[#fafaf7]/90 backdrop-blur-xl"><div className="site-container flex h-[72px] items-center justify-between"><Brand /><div className="flex items-center gap-2"><Link href="/pricing" className="hidden px-3 py-2 text-sm font-bold text-[#59625e] sm:block">Pricing</Link><Link href={session ? "/dash" : "/auth/login"} className="button-secondary min-h-10 px-4 text-xs">{session ? "Dashboard" : "Sign in"}</Link></div></div></header>
      <section className="site-container relative grid items-start gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:py-24">
        <div className="absolute -top-20 -left-48 size-96 rounded-full bg-[#efc676]/20 blur-3xl" />
        <div className="relative max-w-xl lg:sticky lg:top-24"><span className="grid size-12 place-items-center rounded-2xl bg-[#123f35] text-[#f1c779]"><Heart size={21} /></span><p className="eyebrow mt-7 text-[#b55d45]">Support independent craft</p><h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-[-0.055em] text-[#123f35] sm:text-7xl">A little fuel for a clearer future.</h1><p className="mt-6 text-base leading-8 text-[#65706a]">SadeCV is shaped with care by MRsuffix. A one-time tip helps fund design polish, infrastructure, and the quiet details that make professional tools feel exceptional.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-black/[0.07] bg-white/65 p-4"><Sparkles className="text-[#277b67]" size={17} /><p className="mt-3 text-sm font-extrabold">Independent</p><p className="mt-1 text-xs leading-5 text-[#78817c]">No login or subscription required.</p></div><div className="rounded-2xl border border-black/[0.07] bg-white/65 p-4"><Heart className="text-[#d76550]" size={17} /><p className="mt-3 text-sm font-extrabold">One time</p><p className="mt-1 text-xs leading-5 text-[#78817c]">A thank-you, never a recurring charge.</p></div></div></div>
        <TipJar email={session?.user?.email ?? undefined} />
      </section>
    </main>
  );
}
