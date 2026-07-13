import {
  ArrowUpRight,
  Banknote,
  FileText,
  Sparkles,
  UserRoundPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/server";

const number = new Intl.NumberFormat("en-US");
const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminOverviewPage() {
  const data = await api.admin.overview();
  const revenue = data.kpis.revenueByCurrency.length
    ? data.kpis.revenueByCurrency
        .map(({ amount, currency }) =>
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          }).format(amount / 100),
        )
        .join(" · ")
    : "—";
  const cards = [
    { label: "Total users", value: number.format(data.kpis.totalUsers), icon: Users },
    {
      label: "Active subscriptions",
      value: number.format(data.kpis.activeSubscriptions),
      icon: Sparkles,
    },
    { label: "Resumes created", value: number.format(data.kpis.totalResumes), icon: FileText },
    {
      label: "Revenue + donations",
      value: revenue,
      suffix: `${data.kpis.donationCount} donations`,
      icon: Banknote,
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-[#2d7864] uppercase">Command center</p>
          <h1 className="mt-2 font-serif text-4xl tracking-[-0.045em] text-[#123f35] sm:text-5xl">
            Platform overview
          </h1>
          <p className="mt-3 text-sm text-[#6e7873]">Live operational health, growth, and monetization signals.</p>
        </div>
        <p className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-xs font-bold text-[#66706b]">
          Updated {dateTime.format(new Date())}
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {cards.map(({ label, value, suffix, icon: Icon }) => (
          <article key={label} className="rounded-[1.5rem] border border-black/[0.07] bg-white p-5 shadow-[0_14px_50px_rgba(18,63,53,0.055)]">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-[#e6f0eb] text-[#236b58]"><Icon size={18} /></span>
              <ArrowUpRight size={16} className="text-[#a1a9a5]" />
            </div>
            <p className="mt-6 text-3xl font-black tracking-[-0.04em] text-[#183a31]">
              {value}<span className="ml-1 text-[10px] tracking-normal text-[#8a938f]">{suffix}</span>
            </p>
            <p className="mt-1 text-xs font-bold text-[#747d79]">{label}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[1.6rem] border border-black/[0.07] bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-black tracking-wider text-[#2d7864] uppercase">Growth</p><h2 className="mt-1 text-xl font-extrabold">Recent sign-ups</h2></div>
            <Link href="/admin/users" className="text-xs font-black text-[#24705d]">View all</Link>
          </div>
          <div className="mt-5 divide-y divide-black/[0.06]">
            {data.recentUsers.map((user) => (
              <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center gap-3 py-3.5">
                <span className="grid size-9 place-items-center rounded-xl bg-[#eef3ef] text-[#347461]"><UserRoundPlus size={16} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{user.name ?? "Unnamed user"}</p><p className="truncate text-xs text-[#7b8580]">{user.email}</p></div>
                <time className="hidden text-[11px] font-semibold text-[#929a96] sm:block">{dateTime.format(user.createdAt)}</time>
              </Link>
            ))}
            {!data.recentUsers.length ? <p className="py-10 text-center text-sm text-[#89928e]">No users yet.</p> : null}
          </div>
        </section>

        <section className="rounded-[1.6rem] border border-black/[0.07] bg-[#123f35] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-black tracking-wider text-[#9ed7c3] uppercase">Billing pulse</p><h2 className="mt-1 text-xl font-extrabold">Subscription events</h2></div>
            <Link href="/admin/finance" className="text-xs font-black text-[#b7e4d3]">Inspect</Link>
          </div>
          <div className="mt-5 space-y-2.5">
            {data.recentSubscriptions.map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-xl bg-white/[0.065] p-3">
                <span className={`size-2 rounded-full ${["ACTIVE", "TRIALING"].includes(event.status) ? "bg-[#75dbb5]" : "bg-[#ef9a86]"}`} />
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{event.user.name ?? event.user.email}</p><p className="mt-0.5 text-[10px] text-white/45">{event.provider} · {event.status}</p></div>
                <time className="text-[10px] text-white/40">{dateTime.format(event.updatedAt)}</time>
              </div>
            ))}
            {!data.recentSubscriptions.length ? <p className="py-10 text-center text-sm text-white/45">No subscription activity yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
