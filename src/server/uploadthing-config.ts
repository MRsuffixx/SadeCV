import "server-only";

import { env } from "~/env";

type UploadThingTokenPayload = {
  apiKey?: unknown;
  appId?: unknown;
  regions?: unknown;
};

function parseToken(token: string): UploadThingTokenPayload | null {
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      Buffer.from(normalized, "base64").toString("utf8"),
    ) as UploadThingTokenPayload;
  } catch {
    return null;
  }
}

export function getUploadThingConfiguration() {
  const token = env.UPLOADTHING_TOKEN;
  const payload = token ? parseToken(token) : null;
  const configured = Boolean(
    token &&
    payload &&
    typeof payload.apiKey === "string" &&
    payload.apiKey.startsWith("sk_") &&
    typeof payload.appId === "string" &&
    payload.appId.length > 0 &&
    (Array.isArray(payload.regions) || typeof payload.regions === "string"),
  );

  return {
    configured,
    token: configured ? token : undefined,
  };
}
