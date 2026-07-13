import type { Prisma, PrismaClient } from "../../../generated/prisma";
import { TEMPLATE_DEFINITIONS } from "~/templates/registry";

export const FREE_MONTHLY_RESUME_LIMIT = 1;
export const PREMIUM_TEMPLATES = new Set(
  TEMPLATE_DEFINITIONS.filter((template) => template.isPremium).map(
    (template) => template.id,
  ),
);

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export function getCalendarMonth(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    start: new Date(Date.UTC(year, month, 1)),
    end: new Date(Date.UTC(year, month + 1, 1)),
  };
}

export function hasPremiumAccess(
  user: {
    tier: string;
    tierStatus: string;
    tierExpiresAt: Date | null;
  },
  now = new Date(),
) {
  const statusAllowsAccess = ["ACTIVE", "TRIALING"].includes(user.tierStatus);
  const hasNotExpired = !user.tierExpiresAt || user.tierExpiresAt > now;
  return user.tier === "PREMIUM" && statusAllowsAccess && hasNotExpired;
}

export async function getResumeEntitlement(
  db: DatabaseClient,
  userId: string,
  now = new Date(),
) {
  const period = getCalendarMonth(now);
  const [user, used] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tier: true, tierStatus: true, tierExpiresAt: true },
    }),
    db.usageGrant.count({
      where: {
        userId,
        kind: "RESUME_CREATE",
        periodKey: period.key,
      },
    }),
  ]);
  const isPremium = hasPremiumAccess(user, now);

  return {
    plan: isPremium ? ("PREMIUM" as const) : ("FREE" as const),
    subscriptionStatus: user.tierStatus,
    isPremium,
    used,
    limit: isPremium ? null : FREE_MONTHLY_RESUME_LIMIT,
    canCreate: isPremium || used < FREE_MONTHLY_RESUME_LIMIT,
    resetsAt: period.end,
  };
}

export async function consumeResumeGrant(
  db: DatabaseClient,
  userId: string,
  resourceId: string,
  now = new Date(),
) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tier: true, tierStatus: true, tierExpiresAt: true },
  });
  if (hasPremiumAccess(user, now)) return;

  const period = getCalendarMonth(now);
  await db.usageGrant.create({
    data: {
      userId,
      kind: "RESUME_CREATE",
      periodKey: period.key,
      periodStart: period.start,
      periodEnd: period.end,
      resourceId,
    },
  });
}
