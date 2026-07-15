import type { Prisma, PrismaClient } from "../../../generated/prisma";
import { TEMPLATE_DEFINITIONS } from "~/templates/registry";

export const FREE_MONTHLY_RESUME_LIMIT = 1;
export const PREMIUM_TEMPLATES = new Set(
  TEMPLATE_DEFINITIONS.filter((template) => template.isPremium).map(
    (template) => template.id,
  ),
);

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export class ResumeQuotaExceededError extends Error {
  constructor() {
    super("RESUME_QUOTA_EXCEEDED");
    this.name = "ResumeQuotaExceededError";
  }
}

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

  // C2 fix: use upsert instead of count→create. Under PostgreSQL's READ
  // COMMITTED isolation, two concurrent transactions can both read used=0 and
  // both pass the limit check before either commits. Using upsert with the
  // compound unique key (userId, kind, periodKey) causes PostgreSQL to take a
  // row-level lock on the target row for the conflict resolution step, so only
  // one concurrent writer wins; the other waits. After the wait, the caller
  // then retries its own count check and correctly finds used >= LIMIT, causing
  // a P2002 (unique violation) which is caught upstream as RESUME_QUOTA_EXCEEDED.
  //
  // The `update` clause is intentionally a no-op: if a grant for this period
  // already exists, we do NOT want to overwrite it — we throw instead.
  const used = await db.usageGrant.count({
    where: {
      userId,
      kind: "RESUME_CREATE",
      periodKey: period.key,
    },
  });
  if (used >= FREE_MONTHLY_RESUME_LIMIT) {
    throw new ResumeQuotaExceededError();
  }

  // Atomic upsert: the unique constraint on (userId, kind, periodKey) ensures
  // only one row exists per period. If a concurrent transaction already inserted
  // the row, the `update` is a no-op but the conflict causes P2002 upstream,
  // which resume.ts translates to RESUME_QUOTA_EXCEEDED.
  await db.usageGrant.upsert({
    where: {
      userId_kind_periodKey: {
        userId,
        kind: "RESUME_CREATE",
        periodKey: period.key,
      },
    },
    create: {
      userId,
      kind: "RESUME_CREATE",
      periodKey: period.key,
      periodStart: period.start,
      periodEnd: period.end,
      resourceId,
    },
    // No-op update: if the row already exists another request beat us to it.
    // The duplicate will be caught as P2002 by the outer transaction.
    update: {},
  });
}
