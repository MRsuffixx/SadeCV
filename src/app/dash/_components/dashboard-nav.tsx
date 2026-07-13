"use client";

import { FileText, LayoutDashboard, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dash", label: "My CVs", icon: LayoutDashboard },
  { href: "/dash/templates", label: "Templates", icon: FileText, disabled: true },
  { href: "/auth/profile", label: "Profile", icon: UserRound },
  { href: "/auth/profile/edit", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Dashboard">
      {items.map(({ href, label, icon: Icon, disabled }) => {
        const active = href === "/dash" ? pathname === href || pathname.startsWith("/dash/resumes") : pathname === href;
        return (
          <Link
            key={href}
            href={disabled ? "#" : href}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active ? "bg-[#e4f0eb] text-[#174f42]" : disabled ? "cursor-not-allowed text-[#a4aaa7]" : "text-[#626a66] hover:bg-black/[0.035] hover:text-[#1f2824]"
            }`}
          >
            <span className="flex items-center gap-3"><Icon size={17} />{label}</span>
            {disabled && <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">Soon</span>}
          </Link>
        );
      })}
    </nav>
  );
}

