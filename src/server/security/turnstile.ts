import { isIP } from "node:net";

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
  const appHostname = new URL(env.APP_DOMAIN).hostname;
  const localDevelopment =
    env.NODE_ENV === "development" &&
    ["localhost", "127.0.0.1", "::1"].includes(appHostname);
  if (localDevelopment && token === "development-bypass") {
    return true;
  }

  if (!env.TURNSTILE_SECRET_KEY || !token) {
    return false;
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

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
  const candidate =
    env.TRUSTED_PROXY_MODE === "cloudflare"
      ? headers.get("cf-connecting-ip")
      : env.TRUSTED_PROXY_MODE === "platform"
        ? (headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          headers.get("x-real-ip"))
        : null;

  return candidate && isIP(candidate) ? candidate : "unknown";
}
