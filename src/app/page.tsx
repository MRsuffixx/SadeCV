import {
  ArrowRight,
  Check,
  FileText,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";

import { Brand } from "~/app/_components/brand";
import { auth } from "~/server/auth";

const features = [
  [
    LayoutTemplate,
    "Layouts with a point of view",
    "Professionally art-directed templates that stay readable, distinctive, and ATS-aware.",
  ],
  [
    WandSparkles,
    "Write with clarity",
    "Thoughtful prompts turn scattered experience into a focused professional narrative.",
  ],
  [
    ShieldCheck,
    "Private by design",
    "Your career data stays yours, with secure accounts and complete control over sharing.",
  ],
] as const;

export default async function Home() {
  const session = await auth();
  const appHref = session ? "/dash" : "/auth/register";

  return (
    <main className="overflow-hidden">
      <nav className="relative z-20 border-b border-black/[0.06] bg-[#f7f7f2]/85 backdrop-blur-xl">
        <div className="site-container flex h-[76px] items-center justify-between">
          <Brand />
          <div className="hidden items-center gap-8 text-sm font-semibold text-[#59605c] md:flex">
            <a href="#features" className="transition hover:text-[#123f35]">
              Why SadeCV
            </a>
            <a href="#workspace" className="transition hover:text-[#123f35]">
              Workspace
            </a>
            <a href="#principles" className="transition hover:text-[#123f35]">
              Our approach
            </a>
            <Link href="/pricing" className="transition hover:text-[#123f35]">
              Pricing
            </Link>
            <Link href="/support" className="transition hover:text-[#123f35]">
              Support
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {!session && (
              <Link
                href="/auth/login"
                className="hidden px-3 py-2 text-sm font-bold text-[#3c4541] sm:block"
              >
                Sign in
              </Link>
            )}
            <Link href={appHref} className="button-primary min-h-10 px-4">
              {session ? "Open dashboard" : "Build your CV"}{" "}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-16 pb-24 sm:pt-24 lg:pt-28 lg:pb-32">
        <div
          aria-hidden="true"
          className="absolute top-16 -right-32 size-[430px] rounded-full bg-[#b8e3d2]/35 blur-3xl"
        />
        <div className="site-container relative grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-2xl">
            <div className="eyebrow mb-7 text-[#277b67]">
              <span className="size-2 rounded-full bg-[#ef765f]" />
              Thoughtful tools for ambitious people
            </div>
            <h1 className="font-serif text-[clamp(3.6rem,8vw,7.6rem)] leading-[0.85] tracking-[-0.065em] text-[#123f35]">
              Your story,
              <span className="mt-2 block text-[#277b67] italic">
                clearly told.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#5a625e] sm:text-xl">
              Build a CV that feels like you: focused, beautifully structured,
              and ready for the opportunities that matter.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={appHref} className="button-primary px-6">
                Start building for free <ArrowRight size={17} />
              </Link>
              <a href="#workspace" className="button-secondary px-6">
                Explore the workspace
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#69716d]">
              {["No credit card", "ATS-aware", "Export-ready"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <Check size={14} className="text-[#277b67]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[590px]">
            <div className="absolute -top-7 -left-6 z-10 hidden rounded-2xl bg-[#ef765f] px-4 py-3 text-sm font-extrabold text-white shadow-xl sm:block">
              Built to be remembered.
            </div>
            <div className="glass-panel rotate-[1.5deg] rounded-[2rem] p-3 sm:p-5">
              <div className="overflow-hidden rounded-[1.4rem] bg-[#e7eee9] p-4 sm:p-7">
                <div className="mb-4 flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 text-[11px] font-bold text-[#66706b]">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#46a889]" />
                    Saved just now
                  </span>
                  <span>Atlas template</span>
                </div>
                <div className="mx-auto aspect-[0.76] max-w-[390px] bg-white p-[8%] shadow-[0_26px_60px_rgba(18,63,53,0.16)]">
                  <div className="border-b-2 border-[#153f35] pb-5">
                    <div className="font-serif text-[clamp(1.5rem,4vw,2.4rem)] leading-none tracking-[-0.04em] text-[#153f35]">
                      Lena Morrison
                    </div>
                    <div className="mt-2 text-[9px] font-bold tracking-[0.22em] text-[#ef765f] uppercase sm:text-[11px]">
                      Product design lead
                    </div>
                  </div>
                  <div className="grid grid-cols-[0.34fr_0.66fr] gap-5 pt-5">
                    <div>
                      <p className="text-[8px] font-black tracking-[0.15em] text-[#153f35] uppercase">
                        Contact
                      </p>
                      <div className="mt-2 space-y-1.5 text-[7px] leading-relaxed text-[#727975] sm:text-[8px]">
                        <p>lena@studio.co</p>
                        <p>Berlin, Germany</p>
                        <p>lenamorrison.design</p>
                      </div>
                      <p className="mt-5 text-[8px] font-black tracking-[0.15em] text-[#153f35] uppercase">
                        Expertise
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {["Strategy", "Systems", "Research"].map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[#eef4f1] px-1.5 py-1 text-[6px] font-bold text-[#356456] sm:text-[7px]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] font-black tracking-[0.15em] text-[#153f35] uppercase">
                        Profile
                      </p>
                      <p className="mt-2 text-[7px] leading-[1.7] text-[#646c68] sm:text-[8px]">
                        Product design leader turning complex services into
                        clear, human experiences.
                      </p>
                      <p className="mt-5 text-[8px] font-black tracking-[0.15em] text-[#153f35] uppercase">
                        Experience
                      </p>
                      {["Design Director", "Senior Product Designer"].map(
                        (role, index) => (
                          <div key={role} className="mt-3">
                            <p className="text-[8px] font-extrabold sm:text-[9px]">
                              {role}
                            </p>
                            <p className="text-[6px] font-bold text-[#ef765f] sm:text-[7px]">
                              {index
                                ? "Fieldwork · 2017—2021"
                                : "Northstar Labs · 2021—Now"}
                            </p>
                            <div className="mt-2 h-1.5 w-full rounded bg-[#edf0ee]" />
                            <div className="mt-1 h-1.5 w-4/5 rounded bg-[#edf0ee]" />
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute right-4 -bottom-8 flex items-center gap-3 rounded-2xl bg-[#123f35] px-4 py-3 text-white shadow-2xl sm:right-8">
              <span className="grid size-9 place-items-center rounded-xl bg-white/10">
                <Sparkles size={17} className="text-[#b8e3d2]" />
              </span>
              <span>
                <span className="block text-[10px] font-bold tracking-wider text-white/55 uppercase">
                  Clarity score
                </span>
                <span className="text-sm font-extrabold">Excellent · 94%</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#123f35] py-24 text-white lg:py-32">
        <div className="site-container">
          <div className="grid gap-8 border-b border-white/15 pb-12 lg:grid-cols-2">
            <p className="eyebrow text-[#b8e3d2]">
              A better way to present your work
            </p>
            <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              Less noise. More of what makes you{" "}
              <span className="text-[#b8e3d2] italic">exceptional.</span>
            </h2>
          </div>
          <div className="grid lg:grid-cols-3">
            {features.map(([Icon, title, body], index) => (
              <article
                key={title}
                className={`group py-10 lg:px-8 lg:py-14 ${index > 0 ? "border-t border-white/15 lg:border-t-0 lg:border-l" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[#b8e3d2] transition group-hover:bg-[#b8e3d2] group-hover:text-[#123f35]">
                    <Icon size={20} />
                  </span>
                  <span className="font-serif text-3xl text-white/25 italic">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-10 text-xl font-bold tracking-[-0.02em]">
                  {title}
                </h3>
                <p className="mt-4 max-w-sm text-sm leading-7 text-white/62">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workspace" className="bg-[#ebece4] py-24 lg:py-32">
        <div className="site-container grid items-center gap-14 lg:grid-cols-[0.84fr_1.16fr]">
          <div>
            <p className="eyebrow text-[#277b67]">The workspace</p>
            <h2 className="mt-5 max-w-lg font-serif text-5xl leading-[0.98] tracking-[-0.05em] text-[#123f35] sm:text-6xl">
              Everything in its <span className="italic">right place.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-8 text-[#616965]">
              Move from first draft to final export in one focused space. Every
              choice helps hiring teams see your value faster.
            </p>
            <Link href={appHref} className="button-primary mt-8">
              Enter the workspace <ArrowRight size={16} />
            </Link>
          </div>
          <div className="rounded-[2rem] border border-black/10 bg-[#f8f8f4] p-4 shadow-[0_32px_90px_rgba(18,63,53,0.11)] sm:p-6">
            <div className="flex items-center gap-2 border-b border-black/10 pb-4">
              <span className="size-2.5 rounded-full bg-[#ef765f]" />
              <span className="size-2.5 rounded-full bg-[#e1c56e]" />
              <span className="size-2.5 rounded-full bg-[#62ab91]" />
              <span className="ml-3 text-xs font-bold text-[#777e7a]">
                SadeCV workspace
              </span>
            </div>
            <div className="grid min-h-[360px] gap-4 pt-4 sm:grid-cols-[0.36fr_0.64fr]">
              <div className="rounded-2xl bg-white p-4">
                <div className="mb-6 flex items-center gap-2 text-xs font-bold text-[#123f35]">
                  <FileText size={14} />
                  Content
                </div>
                {["Profile", "Experience", "Education", "Skills"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className={`mb-2 rounded-xl px-3 py-3 text-xs font-semibold ${index === 1 ? "bg-[#e8f2ee] text-[#1b604f]" : "text-[#6e7571]"}`}
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
              <div className="grid place-items-center rounded-2xl bg-[#dde6e0] p-6">
                <div className="aspect-[0.72] h-[290px] bg-white p-7 shadow-xl">
                  <div className="h-5 w-2/3 bg-[#153f35]" />
                  <div className="mt-2 h-2 w-1/3 bg-[#ef765f]" />
                  <div className="mt-8 grid grid-cols-[0.3fr_0.7fr] gap-5">
                    <div className="space-y-2">
                      <div className="h-2 w-2/3 bg-[#153f35]" />
                      <div className="h-1.5 w-full bg-[#e4e8e5]" />
                      <div className="h-1.5 w-4/5 bg-[#e4e8e5]" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-1/2 bg-[#153f35]" />
                      <div className="h-1.5 w-full bg-[#e4e8e5]" />
                      <div className="h-1.5 w-5/6 bg-[#e4e8e5]" />
                      <div className="h-2 w-1/2 bg-[#153f35]" />
                      <div className="h-1.5 w-full bg-[#e4e8e5]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="principles" className="py-24 text-center lg:py-32">
        <div className="site-container">
          <p className="eyebrow text-[#ef765f]">
            Your next chapter starts here
          </p>
          <h2 className="mx-auto mt-6 max-w-4xl font-serif text-5xl leading-[0.98] tracking-[-0.055em] text-[#123f35] sm:text-7xl">
            Make the first impression feel like{" "}
            <span className="text-[#277b67] italic">you.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-[#636b67]">
            Start with a blank page. Leave with a clear, confident story of what
            you can do next.
          </p>
          <Link href={appHref} className="button-primary mt-9 px-7">
            Create your first CV <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="bg-[#0d2e27] py-10 text-white">
        <div className="site-container flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Brand inverse />
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} SadeCV by MRsuffix. Crafted for clear
            thinking.
          </p>
          <div className="flex gap-5 text-xs font-semibold text-white/65">
            <a href="mailto:hello@sadecv.com" className="hover:text-white">
              Contact
            </a>
            <Link href="/auth/login" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/support" className="hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
