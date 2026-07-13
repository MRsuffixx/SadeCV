import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { authMiddleware } from "~/server/auth";
import { db } from "~/server/db";
import { isFeatureEnabled } from "~/server/system/feature-flags";

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://*.iyzipay.com https://*.iyzico.com`,
    `style-src-elem 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.ufs.sh https://utfs.io https://*.iyzipay.com https://*.iyzico.com",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://*.ufs.sh https://*.ingest.uploadthing.com https://uploadthing.com https://*.iyzipay.com https://*.iyzico.com",
    "frame-src 'self' blob: https://challenges.cloudflare.com https://*.iyzipay.com https://*.iyzico.com https://checkout.stripe.com",
    "form-action 'self' https://*.iyzipay.com https://*.iyzico.com https://checkout.stripe.com",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production"
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");
}

export default authMiddleware(async (request) => {
  const nonce = Buffer.from(randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const respond = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
  const next = () =>
    respond(NextResponse.next({ request: { headers: requestHeaders } }));
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isMaintenanceRoute = pathname === "/maintenance";
  const userId = request.auth?.user?.id;

  let user: { role: string; bannedAt: Date | null } | null = null;
  if (userId) {
    user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, bannedAt: true },
    });
  }

  if (isAdminRoute) {
    if (!userId) {
      const login = new URL("/auth/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return respond(NextResponse.redirect(login));
    }
    if (!user || user.bannedAt || user.role !== "ADMIN") {
      return respond(
        NextResponse.redirect(
          new URL("/dash?error=admin_required", request.url),
        ),
      );
    }
    return next();
  }

  if (pathname === "/auth/register") {
    if (!(await isFeatureEnabled(db, "REGISTRATION"))) {
      return respond(
        NextResponse.redirect(
          new URL("/auth/login?error=registration_disabled", request.url),
        ),
      );
    }
  }

  if (!isMaintenanceRoute && user?.role !== "ADMIN") {
    if (await isFeatureEnabled(db, "MAINTENANCE_MODE")) {
      return respond(
        NextResponse.redirect(new URL("/maintenance", request.url)),
      );
    }
  }

  return next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|og.png).*)",
  ],
  runtime: "nodejs",
};
