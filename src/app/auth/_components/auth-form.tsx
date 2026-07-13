"use client";

import { ArrowRight, Chrome, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { TurnstileField } from "~/app/_components/turnstile-field";
import {
  googleAuthAction,
  loginAction,
  registerAction,
  type AuthActionState,
} from "~/app/auth/actions";

const initialState: AuthActionState = {};

export function AuthForm({
  mode,
  notice,
  googleEnabled,
}: {
  mode: "login" | "register";
  notice?: string;
  googleEnabled: boolean;
}) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-[#277b67]/20 bg-[#e9f5ef] px-4 py-3 text-sm font-semibold text-[#1e6453]"
        >
          {notice}
        </div>
      )}
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-[#b9503c]/20 bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[#a33e2b]"
        >
          {state.error}
        </div>
      )}

      {mode === "register" && (
        <div>
          <label className="field-label" htmlFor="name">
            Full name
          </label>
          <input
            className="field"
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            required
            minLength={2}
          />
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input
          className="field"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="field-label mb-0" htmlFor="password">
            Password
          </label>
          {mode === "login" && (
            <span className="text-xs font-semibold text-[#84908a]">
              10+ characters recommended
            </span>
          )}
        </div>
        <input
          className="field"
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={
            mode === "login" ? "Enter your password" : "At least 10 characters"
          }
          required
          minLength={mode === "login" ? 1 : 10}
        />
        {mode === "register" && (
          <p className="mt-2 text-[11px] leading-5 text-[#7a827e]">
            Use upper and lowercase letters with at least one number.
          </p>
        )}
      </div>

      <TurnstileField className="pt-1" resetSignal={state} />

      <button
        type="submit"
        disabled={pending}
        className="button-primary w-full disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : (
          <>
            {mode === "login" ? "Sign in" : "Create my account"}
            <ArrowRight size={17} />
          </>
        )}
      </button>

      <div className="flex items-center gap-3 py-1 text-[11px] font-bold tracking-[0.13em] text-[#9aa09d] uppercase">
        <span className="h-px flex-1 bg-black/10" />
        or continue with
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <button
        type="submit"
        formNoValidate
        formAction={googleAuthAction}
        disabled={!googleEnabled}
        className="button-secondary w-full rounded-2xl disabled:cursor-not-allowed disabled:opacity-45"
      >
        <Chrome size={17} />
        {googleEnabled ? "Google" : "Google is not configured"}
      </button>

      {mode === "register" && (
        <p className="px-3 text-center text-[11px] leading-5 text-[#858c88]">
          By continuing, you agree to keep your account secure and use SadeCV
          responsibly.
        </p>
      )}
    </form>
  );
}
