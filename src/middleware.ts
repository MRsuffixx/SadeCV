import { NextResponse } from "next/server";

import { authMiddleware } from "~/server/auth";
import { db } from "~/server/db";
import { isFeatureEnabled } from "~/server/system/feature-flags";

export default authMiddleware(async (request) => {
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
      return NextResponse.redirect(login);
    }
    if (!user || user.bannedAt || user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dash?error=admin_required", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/auth/register") {
    if (!(await isFeatureEnabled(db, "REGISTRATION"))) {
      return NextResponse.redirect(
        new URL("/auth/login?error=registration_disabled", request.url),
      );
    }
  }

  if (!isMaintenanceRoute && user?.role !== "ADMIN") {
    if (await isFeatureEnabled(db, "MAINTENANCE_MODE")) {
      return NextResponse.redirect(new URL("/maintenance", request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|og.png|maintenance).*)",
  ],
  runtime: "nodejs",
};
