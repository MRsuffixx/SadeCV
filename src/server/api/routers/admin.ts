import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma, PrismaClient } from "../../../../generated/prisma";
import { includesNormalizedSearch } from "~/lib/search";
import {
  createTRPCRouter,
  protectedAdminProcedure,
} from "~/server/api/trpc";
import { getCalendarMonth } from "~/server/billing/entitlements";
import { recomputeUserPlan } from "~/server/payments/sync";
import {
  FEATURE_FLAGS,
  listFeatureFlags,
} from "~/server/system/feature-flags";

const roleSchema = z.enum(["USER", "ADMIN"]);
const tierSchema = z.enum(["FREE", "PREMIUM"]);
const featureFlagKeySchema = z.enum([
  "MAINTENANCE_MODE",
  "PDF_GENERATION",
  "REGISTRATION",
]);

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(20),
});

const ADMIN_MUTATION_LOCK_KEY = "__ADMIN_RBAC_MUTEX__";

async function acquireAdminMutationLock(db: Prisma.TransactionClient) {
  await db.featureFlag.upsert({
    where: { key: ADMIN_MUTATION_LOCK_KEY },
    create: {
      key: ADMIN_MUTATION_LOCK_KEY,
      enabled: true,
      description: "Internal lock for serialized administrator mutations.",
    },
    update: {
      description: "Internal lock for serialized administrator mutations.",
    },
  });
}

async function assertNotLastAdmin(
  db: Prisma.TransactionClient,
  userId: string,
) {
  const [target, adminCount] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
    db.user.count({ where: { role: "ADMIN", bannedAt: null } }),
  ]);
  if (target?.role === "ADMIN" && adminCount <= 1) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "LAST_ADMIN_PROTECTED",
    });
  }
}

function auditData(input: {
  actorId: string;
  actorEmail?: string;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: unknown;
}) {
  return {
    actorId: input.actorId,
    actorEmail: input.actorEmail,
    actorName: input.actorName,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadataJson:
      input.metadata === undefined ? undefined : JSON.stringify(input.metadata),
  };
}

type AuditActor = { id: string; email: string; name: string | null };

function auditError(error: unknown) {
  if (error instanceof TRPCError) return `${error.code}: ${error.message}`.slice(0, 500);
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Unknown administrator mutation failure";
}

async function auditedMutation<T>(
  db: PrismaClient,
  actor: AuditActor,
  input: {
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: unknown | ((result: T) => unknown);
  },
  operation: () => Promise<T>,
) {
  const initialMetadata =
    typeof input.metadata === "function" ? undefined : input.metadata;
  const audit = await db.adminAuditLog.create({
    data: {
      ...auditData({
        actorId: actor.id,
        actorEmail: actor.email,
        actorName: actor.name,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: initialMetadata,
      }),
      status: "ATTEMPTED",
    },
  });

  try {
    const result = await operation();
    const metadata =
      typeof input.metadata === "function"
        ? input.metadata(result)
        : input.metadata;
    await db.adminAuditLog.update({
      where: { id: audit.id },
      data: {
        status: "SUCCEEDED",
        errorMessage: null,
        ...(metadata === undefined
          ? {}
          : { metadataJson: JSON.stringify(metadata) }),
      },
    });
    return result;
  } catch (error) {
    await db.adminAuditLog
      .update({
        where: { id: audit.id },
        data: { status: "FAILED", errorMessage: auditError(error) },
      })
      .catch(() => undefined);
    throw error;
  }
}

export const adminRouter = createTRPCRouter({
  overview: protectedAdminProcedure.query(async ({ ctx }) => {
    const revenueSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);
    const [
      totalUsers,
      activeSubscriptions,
      totalResumes,
      donationTotals,
      subscriptionRevenue,
      recentUsers,
      recentSubscriptions,
      recentAudit,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.subscription.count({
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
      }),
      ctx.db.resume.count(),
      ctx.db.donation.groupBy({
        by: ["currency"],
        where: { status: "PAID", paidAt: { gte: revenueSince } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      ctx.db.paymentTransaction.groupBy({
        by: ["currency"],
        where: {
          kind: "SUBSCRIPTION",
          status: "SUCCEEDED",
          occurredAt: { gte: revenueSince },
        },
        _sum: { amount: true },
      }),
      ctx.db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      ctx.db.subscription.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          provider: true,
          status: true,
          updatedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      ctx.db.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { name: true, email: true } } },
      }),
    ]);

    const revenueByCurrency = new Map<string, number>();
    for (const row of donationTotals) {
      revenueByCurrency.set(
        row.currency,
        (revenueByCurrency.get(row.currency) ?? 0) + (row._sum.amount ?? 0),
      );
    }
    for (const row of subscriptionRevenue) {
      const currency = row.currency ?? "UNKNOWN";
      revenueByCurrency.set(
        currency,
        (revenueByCurrency.get(currency) ?? 0) + (row._sum.amount ?? 0),
      );
    }

    return {
      kpis: {
        totalUsers,
        activeSubscriptions,
        totalResumes,
        revenueByCurrency: Array.from(revenueByCurrency, ([currency, amount]) => ({
          currency,
          amount,
        })),
        donationCount: donationTotals.reduce(
          (total, row) => total + row._count._all,
          0,
        ),
        revenueSince,
      },
      recentUsers,
      recentSubscriptions,
      recentAudit,
    };
  }),

  users: protectedAdminProcedure
    .input(
      paginationSchema.extend({
        search: z.string().trim().max(120).default(""),
        role: roleSchema.optional(),
        tier: tierSchema.optional(),
        accountStatus: z.enum(["ACTIVE", "BANNED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const matchingIds = input.search
        ? (
            await ctx.db.user.findMany({
              select: { id: true, name: true, email: true },
            })
          )
            .filter((user) =>
              includesNormalizedSearch(
                [user.name, user.email],
                input.search,
              ),
            )
            .map((user) => user.id)
        : null;
      const where: Prisma.UserWhereInput = {
        ...(matchingIds ? { id: { in: matchingIds } } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.tier ? { tier: input.tier } : {}),
        ...(input.accountStatus === "BANNED"
          ? { bannedAt: { not: null } }
          : input.accountStatus === "ACTIVE"
            ? { bannedAt: null }
            : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            tier: true,
            tierStatus: true,
            tierExpiresAt: true,
            bannedAt: true,
            createdAt: true,
            lastLoginAt: true,
            _count: { select: { resumes: true, subscriptions: true } },
          },
        }),
        ctx.db.user.count({ where }),
      ]);
      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
      };
    }),

  userById: protectedAdminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id },
        include: {
          accounts: {
            select: { id: true, provider: true, providerAccountId: true },
          },
          subscriptions: { orderBy: { updatedAt: "desc" }, take: 20 },
          usageGrants: { orderBy: { createdAt: "desc" }, take: 20 },
          donations: { orderBy: { createdAt: "desc" }, take: 20 },
          _count: { select: { resumes: true } },
        },
      });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const { passwordHash, ...safeUser } = user;
      void passwordHash;
      return safeUser;
    }),

  updateUser: protectedAdminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().trim().min(2).max(80).nullable().optional(),
        email: z.string().trim().toLowerCase().email().max(254).optional(),
        role: roleSchema.optional(),
        adminNotes: z.string().trim().max(2_000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (id === ctx.currentUser.id && data.role === "USER") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "SELF_DEMOTION_BLOCKED" });
      }
      return auditedMutation(
        ctx.db,
        ctx.currentUser,
        {
          action: "USER_UPDATED",
          entityType: "USER",
          entityId: id,
          metadata: { fields: Object.keys(data) },
        },
        () =>
          ctx.db.$transaction(async (tx) => {
            if (data.role === "USER") {
              await acquireAdminMutationLock(tx);
              await assertNotLastAdmin(tx, id);
            }
            return tx.user.update({
              where: { id },
              data,
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                adminNotes: true,
              },
            });
          }),
      );
    }),

  setPremium: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        enabled: z.boolean(),
        expiresAt: z.coerce.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      auditedMutation(
        ctx.db,
        ctx.currentUser,
        {
          action: input.enabled ? "PREMIUM_GRANTED" : "PREMIUM_REVOKED",
          entityType: "USER",
          entityId: input.userId,
          metadata: { expiresAt: input.expiresAt ?? null },
        },
        () =>
          ctx.db.$transaction(async (tx) => {
            const providerSubscriptionId = `admin:${input.userId}`;
            if (input.enabled) {
              await tx.subscription.upsert({
                where: {
                  provider_providerSubscriptionId: {
                    provider: "ADMIN",
                    providerSubscriptionId,
                  },
                },
                create: {
                  userId: input.userId,
                  provider: "ADMIN",
                  providerSubscriptionId,
                  status: "ACTIVE",
                  currentPeriodEnd: input.expiresAt ?? null,
                },
                update: {
                  status: "ACTIVE",
                  currentPeriodEnd: input.expiresAt ?? null,
                },
              });
            } else {
              await tx.subscription.updateMany({
                where: { provider: "ADMIN", providerSubscriptionId },
                data: { status: "CANCELED", currentPeriodEnd: new Date() },
              });
            }
            await recomputeUserPlan(tx, input.userId);
            return { success: true };
          }),
      ),
    ),

  resetQuota: protectedAdminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const period = getCalendarMonth();
      return auditedMutation(
        ctx.db,
        ctx.currentUser,
        {
          action: "QUOTA_RESET",
          entityType: "USER",
          entityId: input.userId,
          metadata: (result: { success: true; deleted: number }) => ({
            period: period.key,
            deleted: result.deleted,
          }),
        },
        async () => {
          const result = await ctx.db.usageGrant.deleteMany({
            where: {
              userId: input.userId,
              kind: "RESUME_CREATE",
              periodKey: period.key,
            },
          });
          return { success: true as const, deleted: result.count };
        },
      );
    }),

  setBan: protectedAdminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        banned: z.boolean(),
        reason: z.string().trim().min(3).max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.currentUser.id && input.banned) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "SELF_BAN_BLOCKED" });
      }
      if (input.banned && !input.reason) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "BAN_REASON_REQUIRED" });
      }
      return auditedMutation(
        ctx.db,
        ctx.currentUser,
        {
          action: input.banned ? "USER_BANNED" : "USER_UNBANNED",
          entityType: "USER",
          entityId: input.userId,
          metadata: { reason: input.reason },
        },
        () =>
          ctx.db.$transaction(async (tx) => {
            if (input.banned) {
              await acquireAdminMutationLock(tx);
              await assertNotLastAdmin(tx, input.userId);
            }
            await tx.user.update({
              where: { id: input.userId },
              data: {
                bannedAt: input.banned ? new Date() : null,
                banReason: input.banned ? input.reason : null,
              },
            });
            await recomputeUserPlan(tx, input.userId);
            return { success: true };
          }),
      );
    }),

  deleteUser: protectedAdminProcedure
    .input(z.object({ userId: z.string().cuid(), confirmationEmail: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.currentUser.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "SELF_DELETE_BLOCKED" });
      }
      const target = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.email !== input.confirmationEmail.toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CONFIRMATION_MISMATCH",
        });
      }
      return auditedMutation(
        ctx.db,
        ctx.currentUser,
        {
          action: "USER_DELETED",
          entityType: "USER",
          entityId: input.userId,
          metadata: { email: target.email },
        },
        () =>
          ctx.db.$transaction(async (tx) => {
            await acquireAdminMutationLock(tx);
            await assertNotLastAdmin(tx, input.userId);
            await tx.user.delete({ where: { id: input.userId } });
            return { success: true };
          }),
      );
    }),

  finance: protectedAdminProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.pageSize;
      const [
        transactions,
        transactionCount,
        donations,
        donationCount,
        subscriptions,
        subscriptionCount,
        webhooks,
        webhookCount,
      ] = await Promise.all([
        ctx.db.paymentTransaction.findMany({
          orderBy: { occurredAt: "desc" },
          skip,
          take: input.pageSize,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.paymentTransaction.count(),
        ctx.db.donation.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: input.pageSize,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.donation.count(),
        ctx.db.subscription.findMany({
          orderBy: { updatedAt: "desc" },
          skip,
          take: input.pageSize,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.subscription.count(),
        ctx.db.paymentEvent.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: input.pageSize,
        }),
        ctx.db.paymentEvent.count(),
      ]);
      const totals = {
        transactions: transactionCount,
        donations: donationCount,
        subscriptions: subscriptionCount,
        webhooks: webhookCount,
      };
      return {
        transactions,
        donations,
        subscriptions,
        webhooks,
        totals,
        page: input.page,
        pageSize: input.pageSize,
        pageCount: Math.max(
          1,
          ...Object.values(totals).map((total) =>
            Math.ceil(total / input.pageSize),
          ),
        ),
      };
    }),

  resumes: protectedAdminProcedure
    .input(
      paginationSchema.extend({
        search: z.string().trim().max(120).default(""),
        template: z.string().trim().max(40).optional(),
        status: z.enum(["DRAFT", "READY", "ARCHIVED"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const matchingIds = input.search
        ? (
            await ctx.db.resume.findMany({
              select: {
                id: true,
                title: true,
                user: { select: { email: true } },
              },
            })
          )
            .filter((resume) =>
              includesNormalizedSearch(
                [resume.title, resume.user.email],
                input.search,
              ),
            )
            .map((resume) => resume.id)
        : null;
      const where: Prisma.ResumeWhereInput = {
        ...(matchingIds ? { id: { in: matchingIds } } : {}),
        ...(input.template ? { template: input.template } : {}),
        ...(input.status ? { status: input.status } : {}),
      };
      const [items, total] = await Promise.all([
        ctx.db.resume.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          select: {
            id: true,
            title: true,
            template: true,
            status: true,
            isPublic: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        ctx.db.resume.count({ where }),
      ]);
      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        pageCount: Math.max(1, Math.ceil(total / input.pageSize)),
      };
    }),

  deleteResume: protectedAdminProcedure
    .input(
      z.object({ resumeId: z.string().cuid(), confirmationTitle: z.string().trim() }),
    )
    .mutation(async ({ ctx, input }) => {
      const resume = await ctx.db.resume.findUnique({
        where: { id: input.resumeId },
        select: { id: true, title: true, userId: true },
      });
      if (!resume) throw new TRPCError({ code: "NOT_FOUND" });
      if (resume.title !== input.confirmationTitle) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CONFIRMATION_MISMATCH",
        });
      }
      return auditedMutation(
        ctx.db,
        ctx.currentUser,
        {
          action: "RESUME_DELETED",
          entityType: "RESUME",
          entityId: resume.id,
          metadata: { title: resume.title, userId: resume.userId },
        },
        async () => {
          await ctx.db.resume.delete({ where: { id: resume.id } });
          return { success: true };
        },
      );
    }),

  settings: protectedAdminProcedure.query(({ ctx }) => listFeatureFlags(ctx.db)),

  updateFeatureFlag: protectedAdminProcedure
    .input(z.object({ key: featureFlagKeySchema, enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const defaults = FEATURE_FLAGS[input.key];
      return auditedMutation(
        ctx.db,
        ctx.currentUser,
        {
          action: "FEATURE_FLAG_UPDATED",
          entityType: "FEATURE_FLAG",
          entityId: input.key,
          metadata: { enabled: input.enabled },
        },
        () =>
          ctx.db.featureFlag.upsert({
            where: { key: input.key },
            create: {
              key: input.key,
              enabled: input.enabled,
              description: defaults.description,
              updatedById: ctx.currentUser.id,
            },
            update: {
              enabled: input.enabled,
              updatedById: ctx.currentUser.id,
            },
          }),
      );
    }),
});
