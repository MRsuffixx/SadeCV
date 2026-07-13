import { Bell, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Brand } from "~/app/_components/brand";
import { DashboardNav } from "~/app/dash/_components/dashboard-nav";
import { auth } from "~/server/auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const initials = (session.user.name ?? session.user.email ?? "S")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f2f3ee]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-black/[0.07] bg-[#fafaf7] p-5 lg:flex lg:flex-col">
        <div className="px-2 py-2">
          <Brand href="/dash" />
        </div>
        <div className="mt-8">
          <DashboardNav />
        </div>
        <div className="mt-auto rounded-2xl bg-[#123f35] p-4 text-white">
          <p className="text-[10px] font-extrabold tracking-[0.13em] text-[#b8e3d2] uppercase">
            SadeCV Free
          </p>
          <p className="mt-2 text-sm font-bold">Your essentials, covered.</p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            Create and refine professional CVs with no clutter.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/3 rounded-full bg-[#b8e3d2]" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-black/[0.07] bg-[#f7f8f3]/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="lg:hidden">
            <Brand href="/dash" />
          </div>
          <p className="hidden text-xs font-bold text-[#818985] lg:block">
            Your professional workspace
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/dash?new=1"
              className="button-primary hidden min-h-9 px-4 text-xs sm:inline-flex"
            >
              <Plus size={15} />
              New CV
            </Link>
            <button
              type="button"
              aria-label="Notifications"
              className="grid size-9 place-items-center rounded-full border border-black/10 bg-white text-[#5f6864]"
            >
              <Bell size={16} />
            </button>
            <Link
              href="/auth/profile"
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1 pr-2 pl-1"
            >
              <span className="grid size-8 place-items-center rounded-full bg-[#dbece5] text-xs font-extrabold text-[#185545]">
                {initials}
              </span>
              <ChevronDown
                size={14}
                className="hidden text-[#77807c] sm:block"
              />
            </Link>
          </div>
        </header>
        <div className="min-h-[calc(100vh-72px)]">{children}</div>
      </div>
    </div>
  );
}
