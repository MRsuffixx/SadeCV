"use client";

import { LoaderCircle, MailCheck } from "lucide-react";
import { useActionState } from "react";

import { TurnstileField } from "~/app/_components/turnstile-field";
import {
  resendVerificationAction,
  type AuthActionState,
} from "~/app/auth/actions";

const initialState: AuthActionState = {};

export function ResendVerificationForm({ email = "" }: { email?: string }) {
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    initialState,
  );

  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[#a33e2b]"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-xl bg-[#e9f5ef] px-4 py-3 text-sm font-semibold text-[#1e6453]"
        >
          {state.success}
          {state.developmentUrl ? (
            <a className="mt-2 block underline" href={state.developmentUrl}>
              Open the local verification link
            </a>
          ) : null}
        </p>
      ) : null}
      <div>
        <label className="field-label" htmlFor="verification-email">
          Email address
        </label>
        <input
          className="field"
          id="verification-email"
          name="email"
          type="email"
          defaultValue={email}
          required
          autoComplete="email"
        />
      </div>
      <TurnstileField resetSignal={state} />
      <button
        type="submit"
        disabled={pending}
        className="button-primary w-full disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle size={17} className="animate-spin" />
        ) : (
          <MailCheck size={17} />
        )}
        Resend verification email
      </button>
    </form>
  );
}
