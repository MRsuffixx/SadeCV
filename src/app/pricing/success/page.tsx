import { ArrowRight, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

import { Brand } from "~/app/_components/brand";

export default function PricingSuccessPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0f392f] p-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(239,198,118,0.2),transparent_35%)]" />
      <div className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#f0c879] text-[#463719]">
          <Crown size={27} />
        </div>
        <p className="mt-7 text-xs font-black tracking-[0.2em] text-[#b7dfd1] uppercase">
          Premium activated
        </p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.045em]">
          Your next move is unlimited.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/65">
          Your checkout is complete. Subscription access is synchronized
          securely in the background.
        </p>
        <Link
          href="/dash?new=1"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f0c879] px-6 font-extrabold text-[#3e3118]"
        >
          <Sparkles size={17} />
          Create a premium CV
          <ArrowRight size={16} />
        </Link>
        <div className="mt-8">
          <Brand inverse />
        </div>
      </div>
    </main>
  );
}
