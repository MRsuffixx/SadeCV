const RESUME_IMAGE_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "ufs.sh",
  "utfs.io",
]);

export function normalizeHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(
      /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`,
    );
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      (!parsed.hostname.includes(".") && parsed.hostname !== "localhost")
    ) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isAllowedResumeImageUrl(value: string) {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === "https:" &&
      (RESUME_IMAGE_HOSTS.has(hostname) || hostname.endsWith(".ufs.sh"))
    );
  } catch {
    return false;
  }
}
