"use client";

import { Chrome, KeyRound, Link2, Save, Unlink } from "lucide-react";
import { useActionState } from "react";

import { TurnstileField } from "~/app/_components/turnstile-field";
import {
  linkGoogleAction,
  unlinkGoogleAction,
  updatePasswordAction,
  updateProfileAction,
  type ProfileActionState,
} from "~/app/auth/profile/actions";

const initial: ProfileActionState = {};

function Message({ state }: { state: ProfileActionState }) {
  if (!state.error && !state.success) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${state.error ? "bg-[#fff0ec] text-[#a33e2b]" : "bg-[#e9f5ef] text-[#1e6453]"}`}
    >
      {state.error ?? state.success}
    </p>
  );
}

export function ProfileEditForms({
  user,
  googleConnected,
  googleEnabled,
}: {
  user: {
    name: string | null;
    email: string;
    locale: string;
    hasPassword: boolean;
  };
  googleConnected: boolean;
  googleEnabled: boolean;
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initial,
  );
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePasswordAction,
    initial,
  );
  const [unlinkState, unlinkAction, unlinkPending] = useActionState(
    unlinkGoogleAction,
    initial,
  );

  return (
    <div className="space-y-6">
      <form
        action={profileAction}
        className="rounded-[1.4rem] border border-black/[0.08] bg-white p-6 shadow-[0_12px_40px_rgba(18,63,53,0.05)]"
      >
        <header className="mb-6">
          <h2 className="text-lg font-extrabold tracking-[-0.02em]">
            Personal details
          </h2>
          <p className="mt-1 text-sm text-[#737c77]">
            The details used across your workspace.
          </p>
        </header>
        <div className="space-y-4">
          <Message state={profileState} />
          <div>
            <label htmlFor="profile-name" className="field-label">
              Full name
            </label>
            <input
              id="profile-name"
              name="name"
              className="field"
              defaultValue={user.name ?? ""}
              required
              minLength={2}
            />
          </div>
          <div>
            <label htmlFor="profile-email" className="field-label">
              Email address
            </label>
            <input
              id="profile-email"
              className="field bg-[#f3f4f0] text-[#767d79]"
              value={user.email}
              disabled
            />
          </div>
          <div>
            <label htmlFor="locale" className="field-label">
              Language preference
            </label>
            <select
              id="locale"
              name="locale"
              className="field"
              defaultValue={user.locale}
            >
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
            </select>
          </div>
          <TurnstileField resetSignal={profileState} />
          <button
            type="submit"
            disabled={profilePending}
            className="button-primary min-h-11"
          >
            <Save size={16} />
            {profilePending ? "Saving…" : "Save details"}
          </button>
        </div>
      </form>

      <form
        action={passwordAction}
        className="rounded-[1.4rem] border border-black/[0.08] bg-white p-6 shadow-[0_12px_40px_rgba(18,63,53,0.05)]"
      >
        <header className="mb-6 flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e7f2ed] text-[#225e4f]">
            <KeyRound size={18} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">
              {user.hasPassword ? "Change password" : "Add a password"}
            </h2>
            <p className="mt-1 text-sm text-[#737c77]">
              {user.hasPassword
                ? "Use a strong, unique password you do not use elsewhere."
                : "Add email sign-in before disconnecting an OAuth account."}
            </p>
          </div>
        </header>
        <div className="space-y-4">
          <Message state={passwordState} />
          {user.hasPassword && (
            <div>
              <label htmlFor="current-password" className="field-label">
                Current password
              </label>
              <input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                className="field"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="new-password" className="field-label">
              New password
            </label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className="field"
              minLength={10}
              required
              placeholder="10+ characters, mixed case and a number"
            />
          </div>
          <TurnstileField resetSignal={passwordState} />
          <button
            type="submit"
            disabled={passwordPending}
            className="button-secondary min-h-11 rounded-xl"
          >
            <KeyRound size={16} />
            {passwordPending
              ? "Updating…"
              : user.hasPassword
                ? "Change password"
                : "Add password"}
          </button>
        </div>
      </form>

      <section className="rounded-[1.4rem] border border-black/[0.08] bg-white p-6 shadow-[0_12px_40px_rgba(18,63,53,0.05)]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">Connected accounts</h2>
            <p className="mt-1 text-sm text-[#737c77]">
              Use more than one secure way to access SadeCV.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase ${googleConnected ? "bg-[#e6f3ed] text-[#236550]" : "bg-[#f0f1ed] text-[#777e7a]"}`}
          >
            {googleConnected ? "Connected" : "Not connected"}
          </span>
        </header>
        <div className="flex items-center gap-4 rounded-2xl border border-black/[0.08] bg-[#fafbf8] p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-white shadow-sm">
            <Chrome size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">Google</p>
            <p className="truncate text-xs text-[#7a827e]">
              {googleConnected
                ? "Linked to " + user.email
                : googleEnabled
                  ? "Connect your Google account"
                  : "Add Google OAuth keys to enable"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          {googleConnected ? (
            <form action={unlinkAction} className="space-y-4">
              <Message state={unlinkState} />
              <TurnstileField resetSignal={unlinkState} />
              <button
                type="submit"
                disabled={unlinkPending || !user.hasPassword}
                className="button-secondary min-h-11 rounded-xl text-[#9d4031] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Unlink size={16} />
                {unlinkPending ? "Disconnecting…" : "Disconnect Google"}
              </button>
            </form>
          ) : (
            <form action={linkGoogleAction} className="space-y-4">
              <TurnstileField />
              <button
                type="submit"
                disabled={!googleEnabled}
                className="button-secondary min-h-11 rounded-xl disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Link2 size={16} />
                Connect Google
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
