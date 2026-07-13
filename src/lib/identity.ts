const TURKEY_NAMES = new Set(["tr", "turkey", "türkiye", "turkiye", "türkey"]);

export function isTurkey(value: string) {
  return TURKEY_NAMES.has(value.trim().toLocaleLowerCase("tr-TR"));
}

export function isValidTurkishIdentityNumber(value: string) {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const digits = [...value].map(Number);
  const odd =
    (digits[0] ?? 0) +
    (digits[2] ?? 0) +
    (digits[4] ?? 0) +
    (digits[6] ?? 0) +
    (digits[8] ?? 0);
  const even =
    (digits[1] ?? 0) + (digits[3] ?? 0) + (digits[5] ?? 0) + (digits[7] ?? 0);

  return (
    (odd * 7 - even) % 10 === digits[9] &&
    digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10 ===
      digits[10]
  );
}

export function isValidBillingIdentity(
  identityNumber: string,
  country: string,
) {
  return isTurkey(country)
    ? isValidTurkishIdentityNumber(identityNumber)
    : /^[A-Za-z0-9][A-Za-z0-9 .'-]{4,49}$/.test(identityNumber);
}
