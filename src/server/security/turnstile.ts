import { env } from "~/env";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
  action?: string;
};

export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  if (env.NODE_ENV !== "production" && token === "development-bypass") {
    return true;
  }

  if (!env.TURNSTILE_SECRET_KEY || !token) {
    return false;
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      },
    );

    if (!response.ok) return false;

    const result = (await response.json()) as TurnstileResponse;
    return result.success;
  } catch {
    return false;
  }
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
