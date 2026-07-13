"use client";

import {
  ArrowRight,
  Check,
  CreditCard,
  Crown,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { IyzicoBillingFields } from "~/app/_components/iyzico-billing-fields";
import { TurnstileField } from "~/app/_components/turnstile-field";
import { api } from "~/trpc/react";

type Provider = "STRIPE" | "IYZICO";

function textField(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

function billingProfile(formData: FormData) {
  return {
    name: textField(formData, "name"),
    surname: textField(formData, "surname"),
    identityNumber: textField(formData, "identityNumber"),
    gsmNumber: textField(formData, "gsmNumber"),
    email: textField(formData, "billingEmail"),
    address: textField(formData, "address"),
    city: textField(formData, "city"),
    district: textField(formData, "district"),
    country: textField(formData, "country", "Türkiye"),
    zipCode: textField(formData, "zipCode"),
  };
}

function renderIyzicoCheckout(content: string) {
  document.open();
  document.write(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Secure iyzico checkout</title><style>body{margin:0;padding:32px;background:#f5f5f0;font-family:Arial,sans-serif}#iyzipay-checkout-form{max-width:760px;margin:auto}</style></head><body><div id="iyzipay-checkout-form" class="responsive"></div>${content}</body></html>`,
  );
  document.close();
}

export function PricingCheckout({
  authenticated,
  email,
}: {
  authenticated: boolean;
  email?: string;
}) {
  const [provider, setProvider] = useState<Provider>("STRIPE");
  const [turnstileToken, setTurnstileToken] = useState("");
  const { data: providers } = api.billing.providers.useQuery();
  const checkout = api.billing.createSubscriptionCheckout.useMutation({
    onSuccess: (result) => {
      if (result.url) window.location.assign(result.url);
      else if (result.checkoutFormContent)
        renderIyzicoCheckout(result.checkoutFormContent);
    },
  });
  const enabled =
    provider === "STRIPE"
      ? providers?.subscription.stripe
      : providers?.subscription.iyzico;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-[1.8rem] border border-black/[0.08] bg-white p-7 shadow-[0_18px_60px_rgba(18,63,53,0.06)] sm:p-9">
        <p className="text-xs font-black tracking-[0.14em] text-[#6e7873] uppercase">
          Free
        </p>
        <h2 className="mt-5 font-serif text-4xl text-[#123f35]">
          Build with focus.
        </h2>
        <p className="mt-4 text-4xl font-black tracking-[-0.04em]">$0</p>
        <p className="mt-1 text-sm text-[#76807b]">Forever</p>
        <ul className="mt-8 space-y-4 text-sm text-[#56605b]">
          {[
            "1 new or duplicated CV per calendar month",
            "Three essential templates",
            "Live preview and pixel-perfect PDF",
            "Secure cloud image uploads",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <Check className="mt-0.5 shrink-0 text-[#2a8069]" size={17} />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href={authenticated ? "/dash" : "/auth/register"}
          className="button-secondary mt-9 w-full"
        >
          {authenticated ? "Open dashboard" : "Start free"}
          <ArrowRight size={16} />
        </Link>
      </article>

      <article className="relative overflow-hidden rounded-[1.8rem] bg-[#123f35] p-7 text-white shadow-[0_25px_80px_rgba(18,63,53,0.24)] sm:p-9">
        <div className="absolute -top-24 -right-16 size-72 rounded-full bg-[#efc676]/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black tracking-[0.14em] text-[#b7dfd1] uppercase">
              Premium
            </p>
            <span className="rounded-full bg-[#f2ca7d] px-3 py-1 text-[10px] font-black text-[#523d19] uppercase">
              Unlimited
            </span>
          </div>
          <h2 className="mt-5 font-serif text-4xl">Move without limits.</h2>
          <p className="mt-4 text-4xl font-black tracking-[-0.04em]">
            $9{" "}
            <span className="text-base font-semibold text-white/55">
              / month
            </span>
          </p>
          <ul className="mt-8 grid gap-4 text-sm text-white/75 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              "Unlimited CV creation",
              "Executive & Studio templates",
              "Priority premium features",
              "AI writing tools, when enabled",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <Sparkles
                  className="mt-0.5 shrink-0 text-[#f2ca7d]"
                  size={16}
                />
                {item}
              </li>
            ))}
          </ul>

          {authenticated ? (
            <form
              className="mt-8 space-y-4 rounded-2xl bg-white p-4 text-[#171a18] sm:p-5"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                checkout.mutate({
                  provider,
                  turnstileToken,
                  ...(provider === "IYZICO"
                    ? { billingProfile: billingProfile(data) }
                    : {}),
                });
              }}
            >
              <div className="grid grid-cols-2 gap-2">
                {(["STRIPE", "IYZICO"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProvider(value)}
                    className={`rounded-xl border px-3 py-3 text-xs font-black ${provider === value ? "border-[#277b67] bg-[#e7f3ee] text-[#195947]" : "border-black/10 bg-white text-[#717a76]"}`}
                  >
                    {value === "STRIPE" ? "Stripe" : "iyzico"}
                  </button>
                ))}
              </div>
              {provider === "IYZICO" ? (
                <IyzicoBillingFields email={email} />
              ) : null}
              <TurnstileField onTokenChange={setTurnstileToken} />
              {checkout.error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-[#fff0ec] px-3 py-2 text-xs font-bold text-[#a33e2b]"
                >
                  Checkout could not be started. Review your details and try
                  again.
                </p>
              ) : null}
              {!enabled && providers ? (
                <p className="text-xs font-semibold text-[#8a6a32]">
                  This provider is awaiting merchant configuration.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={!enabled || !turnstileToken || checkout.isPending}
                className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-45"
              >
                {checkout.isPending ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : provider === "STRIPE" ? (
                  <CreditCard size={17} />
                ) : (
                  <Crown size={17} />
                )}
                {checkout.isPending
                  ? "Opening secure checkout…"
                  : `Continue with ${provider === "STRIPE" ? "Stripe" : "iyzico"}`}
              </button>
            </form>
          ) : (
            <Link
              href="/auth/login?callbackUrl=/pricing"
              className="mt-9 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f2ca7d] px-5 font-extrabold text-[#3e3118] transition hover:-translate-y-0.5"
            >
              <Crown size={17} />
              Sign in to upgrade
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
