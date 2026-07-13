import {
  ArrowLeft,
  Clock,
  FileText,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { UserActions } from "~/app/admin/users/[userId]/_components/user-actions";
import { api } from "~/trpc/server";

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await api.admin.userById({ id: userId });

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-xs font-black text-[#2d725e]"
      >
        <ArrowLeft size={15} />
        Back to users
      </Link>
      <section className="mt-5 rounded-[1.7rem] border border-black/[0.07] bg-[#123f35] p-6 text-white sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-2xl bg-[#a9ddca] text-2xl font-black text-[#123f35]">
              {(user.name?.[0] ?? user.email[0] ?? "U").toUpperCase()}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl tracking-[-0.04em]">
                  {user.name ?? "Unnamed user"}
                </h1>
                {user.role === "ADMIN" ? (
                  <ShieldCheck size={18} className="text-[#9ed7c3]" />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-white/55">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Status label={user.role} />
            <Status label={user.tier} />
            <Status
              label={user.bannedAt ? "BANNED" : "ACTIVE"}
              danger={Boolean(user.bannedAt)}
            />
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Meta
            icon={Clock}
            label="Joined"
            value={dateTime.format(user.createdAt)}
          />
          <Meta
            icon={Clock}
            label="Last login"
            value={
              user.lastLoginAt ? dateTime.format(user.lastLoginAt) : "Never"
            }
          />
          <Meta
            icon={FileText}
            label="Resumes"
            value={String(user._count.resumes)}
          />
          <Meta
            icon={KeyRound}
            label="Linked providers"
            value={
              user.accounts.map((item) => item.provider).join(", ") ||
              "Credentials"
            }
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <UserActions user={user} />
        <aside className="space-y-5">
          <section className="rounded-[1.5rem] border border-black/[0.07] bg-white p-5">
            <h2 className="text-sm font-extrabold">Subscription history</h2>
            <div className="mt-4 space-y-3">
              {user.subscriptions.map((item) => (
                <div key={item.id} className="rounded-xl bg-[#f4f6f3] p-3">
                  <div className="flex justify-between text-[10px] font-black">
                    <span>{item.provider}</span>
                    <span>{item.status}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[#7d8682]">
                    Updated {dateTime.format(item.updatedAt)}
                  </p>
                </div>
              ))}
              {!user.subscriptions.length ? (
                <p className="text-xs text-[#828b87]">No subscriptions.</p>
              ) : null}
            </div>
          </section>
          <section className="rounded-[1.5rem] border border-black/[0.07] bg-white p-5">
            <h2 className="text-sm font-extrabold">Recent usage</h2>
            <div className="mt-4 space-y-2">
              {user.usageGrants.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-black/[0.06] p-3 text-[10px]"
                >
                  <span className="font-black">{item.kind}</span>
                  <span className="text-[#818a86]">{item.periodKey}</span>
                </div>
              ))}
              {!user.usageGrants.length ? (
                <p className="text-xs text-[#828b87]">No quota usage.</p>
              ) : null}
            </div>
          </section>
          <section className="rounded-[1.5rem] border border-black/[0.07] bg-white p-5">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-[#2c745f]" />
              <h2 className="text-sm font-extrabold">Account ID</h2>
            </div>
            <code className="mt-3 block rounded-xl bg-[#f2f4f1] p-3 text-[10px] break-all text-[#64706a]">
              {user.id}
            </code>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Status({
  label,
  danger = false,
}: {
  label: string;
  danger?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-black tracking-wider ${danger ? "bg-[#ef8d79] text-[#3b1711]" : "bg-white/10 text-white/70"}`}
    >
      {label}
    </span>
  );
}
function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.065] p-3">
      <div className="flex items-center gap-1.5 text-[9px] font-black tracking-wider text-[#9ed7c3] uppercase">
        <Icon size={12} />
        {label}
      </div>
      <p className="mt-1.5 truncate text-xs font-bold text-white/80">{value}</p>
    </div>
  );
}
