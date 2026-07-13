"use client";

import { Coffee, CreditCard, Heart, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { IyzicoBillingFields } from "~/app/_components/iyzico-billing-fields";
import { TurnstileField } from "~/app/_components/turnstile-field";
import { api } from "~/trpc/react";

type Provider = "STRIPE" | "IYZICO";

const amounts = {
  STRIPE: [5, 15, 30],
  IYZICO: [100, 250, 500],
} as const;

function textField(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

function readBillingProfile(formData: FormData) {
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

export function TipJar({ email }: { email?: string }) {
  const [provider, setProvider] = useState<Provider>("STRIPE");
  const [amount, setAmount] = useState("15");
  const [custom, setCustom] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const { data: providers } = api.billing.providers.useQuery();
  const checkout = api.billing.createDonationCheckout.useMutation({
    onSuccess: (result) => window.location.assign(result.url),
  });

  useEffect(() => {
    setAmount(String(amounts[provider][1]));
    setCustom(false);
  }, [provider]);

  const currency = provider === "IYZICO" ? "TRY" : "USD";
  const enabled =
    provider === "STRIPE"
      ? providers?.donation.stripe
      : providers?.donation.iyzico;

  return (
    <form
      className="rounded-[1.8rem] border border-black/[0.08] bg-white p-6 shadow-[0_25px_80px_rgba(18,63,53,0.09)] sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount)) return;
        const data = new FormData(event.currentTarget);
        const receiptEmail = textField(data, "supporterEmail");
        checkout.mutate({
          provider,
          amount: Math.round(numericAmount * 100),
          currency,
          turnstileToken,
          ...(provider === "STRIPE"
            ? { email: receiptEmail.length ? receiptEmail : undefined }
            : { billingProfile: readBillingProfile(data) }),
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f0f2ed] p-1.5">
        {(["STRIPE", "IYZICO"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setProvider(value)}
            className={`rounded-xl px-4 py-3 text-xs font-black transition ${provider === value ? "bg-white text-[#174d40] shadow-sm" : "text-[#77807b]"}`}
          >
            {value === "STRIPE" ? "Global · Stripe" : "Türkiye · iyzico"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {amounts[provider].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setAmount(String(value));
              setCustom(false);
            }}
            className={`rounded-2xl border px-3 py-4 text-sm font-black transition ${!custom && amount === String(value) ? "border-[#277b67] bg-[#e8f3ee] text-[#195947]" : "border-black/10 bg-white text-[#68716d] hover:border-[#277b67]/35"}`}
          >
            {new Intl.NumberFormat(provider === "IYZICO" ? "tr-TR" : "en-US", {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            }).format(value)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setCustom(true);
            setAmount("");
          }}
          className={`rounded-2xl border px-3 py-4 text-sm font-black transition ${custom ? "border-[#277b67] bg-[#e8f3ee] text-[#195947]" : "border-black/10 bg-white text-[#68716d]"}`}
        >
          Custom
        </button>
      </div>

      {custom ? (
        <label className="mt-4 block">
          <span className="field-label">Custom amount ({currency})</span>
          <div className="relative">
            <span className="absolute top-1/2 left-4 -translate-y-1/2 font-bold text-[#7b837f]">
              {provider === "IYZICO" ? "₺" : "$"}
            </span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              name="amount"
              min="1"
              max="5000"
              step="1"
              className="field pl-9"
              required
              autoFocus
            />
          </div>
        </label>
      ) : null}

      {provider === "STRIPE" ? (
        <label className="mt-5 block">
          <span className="field-label">Receipt email (optional)</span>
          <input
            name="supporterEmail"
            type="email"
            defaultValue={email}
            className="field"
            placeholder="you@example.com"
          />
        </label>
      ) : (
        <div className="mt-5">
          <IyzicoBillingFields email={email} />
        </div>
      )}

      <div className="mt-5">
        <TurnstileField
          onTokenChange={setTurnstileToken}
          resetSignal={`${provider}:${checkout.failureCount}`}
        />
      </div>
      {checkout.error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-[#fff0ec] px-4 py-3 text-xs font-bold text-[#a33e2b]"
        >
          The secure checkout could not be opened. Please review the details and
          try again.
        </p>
      ) : null}
      {!enabled && providers ? (
        <p className="mt-4 text-xs font-semibold text-[#8a6a32]">
          This payment provider is awaiting merchant configuration.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!enabled || !turnstileToken || !amount || checkout.isPending}
        className="button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-45"
      >
        {checkout.isPending ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : provider === "STRIPE" ? (
          <CreditCard size={18} />
        ) : (
          <Heart size={18} />
        )}
        {checkout.isPending
          ? "Opening secure checkout…"
          : `Support with ${provider === "STRIPE" ? "Stripe" : "iyzico"}`}
      </button>
      <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] font-semibold text-[#8a918d]">
        <Coffee size={13} />
        One-time support only. This never creates a subscription.
      </p>
    </form>
  );
}
