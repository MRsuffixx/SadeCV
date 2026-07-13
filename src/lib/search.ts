export function normalizeSearchText(value: string | null | undefined) {
  return (value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

export function includesNormalizedSearch(
  values: Array<string | null | undefined>,
  query: string,
) {
  const normalizedQuery = normalizeSearchText(query);
  return values.some((value) =>
    normalizeSearchText(value).includes(normalizedQuery),
  );
}
