import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Brand } from "~/app/_components/brand";
import { AdminNav } from "~/app/admin/_components/admin-nav";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/admin");
  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, bannedAt: true },
  });
  if (!admin || admin.bannedAt || admin.role !== "ADMIN") {
    redirect("/dash?error=admin_required");
  }

  return (
    <div className="min-h-screen bg-[#eff2ed] text-[#18221e]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-[#102f28] p-5 text-white lg:flex">
        <div className="rounded-2xl bg-white px-4 py-3 text-[#123f35]">
          <Brand href="/admin" />
        </div>
        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
          <span className="grid size-10 place-items-center rounded-xl bg-[#a8ddc9] text-[#123f35]">
            <ShieldCheck size={19} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold">{admin.name ?? "Administrator"}</p>
            <p className="mt-0.5 truncate text-[10px] text-white/50">{admin.email}</p>
          </div>
        </div>
        <div className="mt-7">
          <AdminNav />
        </div>
        <div className="mt-auto rounded-2xl border border-white/10 bg-black/10 p-4">
          <p className="text-[10px] font-black tracking-[0.16em] text-[#9ed7c3] uppercase">
            Secure control plane
          </p>
          <p className="mt-2 text-xs leading-5 text-white/48">
            Sensitive changes are server-authorized and audit logged.
          </p>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-black/[0.07] bg-[#f7f9f5]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <Brand href="/admin" />
            <span className="rounded-full bg-[#dcebe4] px-3 py-1 text-[10px] font-black tracking-wider text-[#185545] uppercase">
              Admin
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[660px] rounded-2xl bg-[#102f28] p-2">
              <AdminNav />
            </div>
          </div>
        </header>
        <main className="min-h-screen p-4 sm:p-7 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
