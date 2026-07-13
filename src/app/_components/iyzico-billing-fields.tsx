export function IyzicoBillingFields({ email }: { email?: string }) {
  return (
    <div className="rounded-2xl border border-[#d9c9a6]/55 bg-[#fffaf0] p-4">
      <p className="text-xs font-extrabold text-[#6f5730]">
        iyzico billing details
      </p>
      <p className="mt-1 text-[11px] leading-5 text-[#8a7858]">
        Sent securely to iyzico for identity and payment verification. SadeCV
        does not persist these fields.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <BillingField
          name="name"
          label="First name"
          autoComplete="given-name"
        />
        <BillingField
          name="surname"
          label="Surname"
          autoComplete="family-name"
        />
        <BillingField
          name="identityNumber"
          label="T.C. identity number"
          inputMode="numeric"
          pattern="[0-9]{11}"
        />
        <BillingField
          name="gsmNumber"
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          placeholder="+905551112233"
        />
        <BillingField
          name="billingEmail"
          label="Email"
          type="email"
          autoComplete="email"
          defaultValue={email}
        />
        <BillingField
          name="zipCode"
          label="Postcode"
          autoComplete="postal-code"
        />
        <BillingField name="city" label="City" autoComplete="address-level1" />
        <BillingField
          name="district"
          label="District"
          autoComplete="address-level2"
        />
        <label className="sm:col-span-2">
          <span className="field-label">Billing address</span>
          <input
            name="address"
            className="field"
            autoComplete="street-address"
            required
            minLength={5}
            maxLength={240}
          />
        </label>
        <input type="hidden" name="country" value="Türkiye" />
      </div>
    </div>
  );
}

function BillingField({
  name,
  label,
  type = "text",
  ...props
}: {
  name: string;
  label: string;
  type?: string;
  [key: string]: string | undefined;
}) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <input name={name} type={type} className="field" required {...props} />
    </label>
  );
}
