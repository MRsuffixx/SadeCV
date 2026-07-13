import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "~/env";
import { consumeEmailVerification } from "~/server/auth/email-verification";
import { rateLimit } from "~/server/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = z
    .string()
    .min(32)
    .max(256)
    .safeParse(new URL(request.url).searchParams.get("token"));
  const destination = new URL("/auth/login", env.APP_DOMAIN);
  if (!token.success) {
    destination.searchParams.set("verification", "invalid");
    return NextResponse.redirect(destination);
  }

  const allowed = await rateLimit(`auth:verify:${token.data.slice(0, 16)}`, {
    limit: 10,
    windowSeconds: 15 * 60,
  });
  const verified = allowed && (await consumeEmailVerification(token.data));
  destination.searchParams.set(
    "verification",
    verified ? "success" : "invalid",
  );
  return NextResponse.redirect(destination);
}
