"use client";

import {
  Activity,
  FileText,
  LayoutDashboard,
  Settings2,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/finance", label: "Financials", icon: WalletCards },
  { href: "/admin/resumes", label: "Resumes", icon: FileText },
  { href: "/admin/settings", label: "System settings", icon: Settings2 },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="space-y-1.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
              active
                ? "bg-white text-[#123f35] shadow-sm"
                : "text-white/58 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Icon size={17} />
            {label}
          </Link>
        );
      })}
      <div className="my-4 border-t border-white/10" />
      <Link
        href="/dash"
        className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-[#9ed7c3] transition hover:bg-white/8"
      >
        <Activity size={17} />
        User dashboard
      </Link>
    </nav>
  );
}
