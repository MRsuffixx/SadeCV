import { Check, Quote } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Brand } from "~/app/_components/brand";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-[#f7f7f2] lg:grid-cols-[0.88fr_1.12fr]">
      <aside className="relative hidden overflow-hidden bg-[#123f35] p-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-28 size-[420px] rounded-full border-[70px] border-[#b8e3d2]/10"
        />
        <div
          aria-hidden="true"
          className="absolute top-28 -right-20 size-56 rotate-12 rounded-[3rem] bg-[#ef765f]/90"
        />
        <Brand inverse />
        <div className="relative z-10 my-auto max-w-lg">
          <Quote size={35} className="mb-8 text-[#b8e3d2]" />
          <blockquote className="font-serif text-4xl leading-[1.13] tracking-[-0.035em]">
            The best CV doesn&apos;t say everything. It makes the{" "}
            <span className="text-[#b8e3d2] italic">right things</span>{" "}
            impossible to miss.
          </blockquote>
          <div className="mt-10 space-y-3">
            {[
              "Calm, guided creation",
              "Professional layouts",
              "Your data under your control",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm font-semibold text-white/70"
              >
                <span className="grid size-6 place-items-center rounded-full bg-white/10 text-[#b8e3d2]">
                  <Check size={13} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-white/40">
          SadeCV · Crafted for clear thinking
        </p>
      </aside>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-[#68706c] transition hover:text-[#123f35]"
          >
            Back to home
          </Link>
        </div>
        <div className="my-auto w-full max-w-[450px] self-center py-12">
          <div className="mb-8">
            <p className="eyebrow mb-4 text-[#277b67]">Welcome to SadeCV</p>
            <h1 className="font-serif text-4xl tracking-[-0.04em] text-[#123f35] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-[#69716d]">{subtitle}</p>
          </div>
          {children}
          <div className="mt-7 text-center text-sm text-[#68706c]">
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}
