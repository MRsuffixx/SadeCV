import "server-only";

import { TRPCError } from "@trpc/server";

import { env } from "~/env";

export function hasTrustedOrigin(headers: Headers) {
  const origin = headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(env.APP_DOMAIN).origin;
  } catch {
    return false;
  }
}

export function assertTrustedOrigin(headers: Headers) {
  if (!hasTrustedOrigin(headers)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "UNTRUSTED_ORIGIN" });
  }
}
