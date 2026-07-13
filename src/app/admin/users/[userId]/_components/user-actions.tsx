"use client";

import { Ban, Crown, RefreshCcw, Save, Trash2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    tier: string;
    bannedAt: Date | null;
    banReason: string | null;
    adminNotes: string | null;
  };
};

export function UserActions({ user }: Props) {
  const router = useRouter();
  const utils = api.useUtils();
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role === "ADMIN" ? "ADMIN" : "USER");
  const [adminNotes, setAdminNotes] = useState(user.adminNotes ?? "");
  const [banReason, setBanReason] = useState(user.banReason ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [notice, setNotice] = useState("");

  const complete = async (message: string) => {
    await Promise.all([
      utils.admin.userById.invalidate({ id: user.id }),
      utils.admin.users.invalidate(),
      utils.admin.overview.invalidate(),
    ]);
    setNotice(message);
    router.refresh();
  };

  const update = api.admin.updateUser.useMutation({ onSuccess: () => complete("Account details saved.") });
  const premium = api.admin.setPremium.useMutation({ onSuccess: (_, variables) => complete(variables.enabled ? "Manual premium access granted." : "Manual premium grant revoked.") });
  const quota = api.admin.resetQuota.useMutation({ onSuccess: () => complete("Current monthly quota reset.") });
  const ban = api.admin.setBan.useMutation({ onSuccess: (_, variables) => complete(variables.banned ? "Account banned and active sessions invalidated." : "Account access restored.") });
  const remove = api.admin.deleteUser.useMutation({ onSuccess: () => router.push("/admin/users") });

  const error = update.error ?? premium.error ?? quota.error ?? ban.error ?? remove.error;
  const pending = update.isPending || premium.isPending || quota.isPending || ban.isPending || remove.isPending;

  return (
    <div className="space-y-5">
      {(notice || error) ? (
        <p role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-xs font-bold ${error ? "border-[#e7bdb5] bg-[#fff3f0] text-[#a14b3b]" : "border-[#b9ddce] bg-[#eef8f3] text-[#216652]"}`}>
          {error?.message ?? notice}
        </p>
      ) : null}

      <ActionCard title="Account details" description="Identity, role, and internal support context.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="field" value={name} onChange={(event) => setName(event.target.value)} /></Field>
          <Field label="Email"><input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Field label="Role">
            <select className="field" value={role} onChange={(event) => setRole(event.target.value)}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select>
          </Field>
          <Field label="Admin notes"><textarea className="field min-h-24 resize-y" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} maxLength={2000} /></Field>
        </div>
        <button type="button" disabled={pending} onClick={() => update.mutate({ id: user.id, name: name || null, email, role: role as "USER" | "ADMIN", adminNotes: adminNotes || null })} className="button-primary mt-5 min-h-10 rounded-xl px-4 text-xs disabled:opacity-50"><Save size={15} />Save changes</button>
      </ActionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <ActionCard title="Premium support grant" description="Independent of paid Stripe or iyzico subscriptions.">
          <Field label="Optional expiration"><input className="field" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></Field>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={() => premium.mutate({ userId: user.id, enabled: true, expiresAt: expiresAt ? new Date(expiresAt) : null })} className="button-primary min-h-10 rounded-xl px-4 text-xs disabled:opacity-50"><Crown size={15} />Grant premium</button>
            <button type="button" disabled={pending} onClick={() => premium.mutate({ userId: user.id, enabled: false })} className="button-secondary min-h-10 rounded-xl px-4 text-xs disabled:opacity-50">Revoke manual grant</button>
          </div>
        </ActionCard>

        <ActionCard title="Monthly CV quota" description="Remove this month’s free-tier usage grant.">
          <p className="rounded-xl bg-[#f3f5f2] p-3 text-xs leading-5 text-[#65706b]">The user can create one new CV again in the current UTC calendar month.</p>
          <button type="button" disabled={pending} onClick={() => quota.mutate({ userId: user.id })} className="button-secondary mt-4 min-h-10 rounded-xl px-4 text-xs disabled:opacity-50"><RefreshCcw size={15} />Reset quota</button>
        </ActionCard>
      </div>

      <ActionCard title="Account access" description="Bans immediately block tRPC, uploads, and future sign-ins.">
        {user.bannedAt ? (
          <button type="button" disabled={pending} onClick={() => ban.mutate({ userId: user.id, banned: false })} className="button-primary min-h-10 rounded-xl px-4 text-xs disabled:opacity-50"><UserCheck size={15} />Restore access</button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Required ban reason"><input className="field" value={banReason} onChange={(event) => setBanReason(event.target.value)} placeholder="Policy or security reason" /></Field>
            <button type="button" disabled={pending || banReason.trim().length < 3} onClick={() => ban.mutate({ userId: user.id, banned: true, reason: banReason })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#9e493b] px-4 text-xs font-black text-white disabled:opacity-40"><Ban size={15} />Ban account</button>
          </div>
        )}
      </ActionCard>

      <section className="rounded-[1.5rem] border border-[#dfb7af] bg-[#fff8f6] p-5">
        <p className="text-xs font-black tracking-wider text-[#a74d3d] uppercase">Danger zone</p>
        <h2 className="mt-1 text-lg font-extrabold">Permanently delete account</h2>
        <p className="mt-2 text-xs leading-5 text-[#7a625d]">This removes the user and cascading account data. Type the exact email to authorize deletion.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input className="field" value={confirmationEmail} onChange={(event) => setConfirmationEmail(event.target.value)} placeholder={user.email} />
          <button type="button" disabled={pending || confirmationEmail.toLowerCase() !== user.email.toLowerCase()} onClick={() => remove.mutate({ userId: user.id, confirmationEmail })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#8f3f33] px-4 text-xs font-black text-white disabled:opacity-35"><Trash2 size={15} />Delete permanently</button>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-[1.5rem] border border-black/[0.07] bg-white p-5"><h2 className="text-lg font-extrabold">{title}</h2><p className="mt-1 mb-5 text-xs leading-5 text-[#77817c]">{description}</p>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="field-label">{label}</span>{children}</label>;
}
