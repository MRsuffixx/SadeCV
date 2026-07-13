import { ArrowRight, Heart, Sparkles } from "lucide-react";
import Link from "next/link";

import { Brand } from "~/app/_components/brand";

const particles = Array.from({ length: 18 }, (_, index) => ({
  left: `${8 + ((index * 29) % 84)}%`,
  delay: `${(index % 7) * 0.12}s`,
  duration: `${2.5 + (index % 5) * 0.35}s`,
}));

export default function DonationSuccessPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f5f3ec] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(239,198,118,0.32),transparent_34%)]" />
      {particles.map((particle, index) => <span key={index} aria-hidden="true" className="support-particle absolute bottom-[-3rem] text-[#e16d58]" style={{ left: particle.left, animationDelay: particle.delay, animationDuration: particle.duration }}>{index % 3 === 0 ? <Sparkles size={15} /> : <Heart size={12} fill="currentColor" />}</span>)}
      <div className="relative w-full max-w-xl rounded-[2rem] border border-white/80 bg-white/75 p-8 text-center shadow-[0_30px_100px_rgba(18,63,53,0.14)] backdrop-blur-xl sm:p-12">
        <div className="support-heart mx-auto grid size-20 place-items-center rounded-[2rem] bg-[#e86e58] text-white shadow-[0_18px_45px_rgba(232,110,88,0.3)]"><Heart size={31} fill="currentColor" /></div>
        <p className="mt-8 text-xs font-black tracking-[0.2em] text-[#277b67] uppercase">Payment successful</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[-0.05em] text-[#123f35]">That means more than you know.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#68736e]">Thank you for supporting SadeCV and the careful work behind it. Your contribution has been securely recorded.</p>
        <Link href="/" className="button-primary mt-8">Back to SadeCV<ArrowRight size={16} /></Link>
        <div className="mt-8"><Brand /></div>
      </div>
    </main>
  );
}
