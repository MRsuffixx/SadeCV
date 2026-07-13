const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(
  amountInMinorUnits: number,
  currency: string | null | undefined,
  locale = "en-US",
) {
  const normalized = currency?.trim().toUpperCase() || "UNKNOWN";
  const key = `${locale}:${normalized}`;

  try {
    let formatter = currencyFormatters.get(key);
    formatter ??= new Intl.NumberFormat(locale, {
      style: "currency",
      currency: normalized,
    });
    currencyFormatters.set(key, formatter);
    return formatter.format(amountInMinorUnits / 100);
  } catch {
    return `${(amountInMinorUnits / 100).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${normalized}`;
  }
}
