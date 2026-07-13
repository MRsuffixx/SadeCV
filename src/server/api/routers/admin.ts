import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Prisma } from "../../../../generated/prisma";
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
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: unknown;
}) {
  return {
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadataJson:
      input.metadata === undefined ? undefined : JSON.stringify(input.metadata),
  };
}

export const adminRouter = createTRPCRouter({
  overview: protectedAdminProcedure.query(async ({ ctx }) => {
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
        where: { status: "PAID" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      ctx.db.paymentTransaction.groupBy({
        by: ["currency"],
        where: { kind: "SUBSCRIPTION", status: "SUCCEEDED" },
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
      if (!row.currency) continue;
      revenueByCurrency.set(
        row.currency,
        (revenueByCurrency.get(row.currency) ?? 0) + (row._sum.amount ?? 0),
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
      const where: Prisma.UserWhereInput = {
        ...(input.search
          ? {
              OR: [
                { name: { contains: input.search } },
                { email: { contains: input.search } },
              ],
            }
          : {}),
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
      return ctx.db.$transaction(async (tx) => {
        if (data.role === "USER") await assertNotLastAdmin(tx, id);
        const user = await tx.user.update({
          where: { id },
          data,
          select: { id: true, name: true, email: true, role: true, adminNotes: true },
        });
        await tx.adminAuditLog.create({
          data: auditData({
            actorId: ctx.currentUser.id,
            action: "USER_UPDATED",
            entityType: "USER",
            entityId: id,
            metadata: { fields: Object.keys(data) },
          }),
        });
        return user;
      });
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
        await tx.adminAuditLog.create({
          data: auditData({
            actorId: ctx.currentUser.id,
            action: input.enabled ? "PREMIUM_GRANTED" : "PREMIUM_REVOKED",
            entityType: "USER",
            entityId: input.userId,
            metadata: { expiresAt: input.expiresAt ?? null },
          }),
        });
        return { success: true };
      }),
    ),

  resetQuota: protectedAdminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const period = getCalendarMonth();
      return ctx.db.$transaction(async (tx) => {
        const result = await tx.usageGrant.deleteMany({
          where: {
            userId: input.userId,
            kind: "RESUME_CREATE",
            periodKey: period.key,
          },
        });
        await tx.adminAuditLog.create({
          data: auditData({
            actorId: ctx.currentUser.id,
            action: "QUOTA_RESET",
            entityType: "USER",
            entityId: input.userId,
            metadata: { period: period.key, deleted: result.count },
          }),
        });
        return { success: true, deleted: result.count };
      });
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
      return ctx.db.$transaction(async (tx) => {
        if (input.banned) await assertNotLastAdmin(tx, input.userId);
        await tx.user.update({
          where: { id: input.userId },
          data: {
            bannedAt: input.banned ? new Date() : null,
            banReason: input.banned ? input.reason : null,
          },
        });
        await tx.session.deleteMany({ where: { userId: input.userId } });
        await tx.adminAuditLog.create({
          data: auditData({
            actorId: ctx.currentUser.id,
            action: input.banned ? "USER_BANNED" : "USER_UNBANNED",
            entityType: "USER",
            entityId: input.userId,
            metadata: { reason: input.reason },
          }),
        });
        return { success: true };
      });
    }),

  deleteUser: protectedAdminProcedure
    .input(z.object({ userId: z.string().cuid(), confirmationEmail: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.currentUser.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "SELF_DELETE_BLOCKED" });
      }
      return ctx.db.$transaction(async (tx) => {
        const target = await tx.user.findUnique({
          where: { id: input.userId },
          select: { email: true },
        });
        if (!target) throw new TRPCError({ code: "NOT_FOUND" });
        if (target.email !== input.confirmationEmail.toLowerCase()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CONFIRMATION_MISMATCH" });
        }
        await assertNotLastAdmin(tx, input.userId);
        await tx.adminAuditLog.create({
          data: auditData({
            actorId: ctx.currentUser.id,
            action: "USER_DELETED",
            entityType: "USER",
            entityId: input.userId,
            metadata: { email: target.email },
          }),
        });
        await tx.user.delete({ where: { id: input.userId } });
        return { success: true };
      });
    }),

  finance: protectedAdminProcedure
    .input(z.object({ take: z.number().int().min(10).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const [transactions, donations, subscriptions, webhooks] = await Promise.all([
        ctx.db.paymentTransaction.findMany({
          orderBy: { occurredAt: "desc" },
          take: input.take,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.donation.findMany({
          orderBy: { createdAt: "desc" },
          take: input.take,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.subscription.findMany({
          orderBy: { updatedAt: "desc" },
          take: input.take,
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        ctx.db.paymentEvent.findMany({
          orderBy: { createdAt: "desc" },
          take: input.take,
        }),
      ]);
      return { transactions, donations, subscriptions, webhooks };
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
      const where: Prisma.ResumeWhereInput = {
        ...(input.search
          ? {
              OR: [
                { title: { contains: input.search } },
                { user: { email: { contains: input.search } } },
              ],
            }
          : {}),
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
    .mutation(async ({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const resume = await tx.resume.findUnique({
          where: { id: input.resumeId },
          select: { id: true, title: true, userId: true },
        });
        if (!resume) throw new TRPCError({ code: "NOT_FOUND" });
        if (resume.title !== input.confirmationTitle) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CONFIRMATION_MISMATCH" });
        }
        await tx.resume.delete({ where: { id: resume.id } });
        await tx.adminAuditLog.create({
          data: auditData({
            actorId: ctx.currentUser.id,
            action: "RESUME_DELETED",
            entityType: "RESUME",
            entityId: resume.id,
            metadata: { title: resume.title, userId: resume.userId },
          }),
        });
        return { success: true };
      }),
    ),

  settings: protectedAdminProcedure.query(({ ctx }) => listFeatureFlags(ctx.db)),

  updateFeatureFlag: protectedAdminProcedure
    .input(z.object({ key: featureFlagKeySchema, enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const defaults = FEATURE_FLAGS[input.key];
      const flag = await ctx.db.$transaction(async (tx) => {
        const updated = await tx.featureFlag.upsert({
          where: { key: input.key },
          create: {
            key: input.key,
            enabled: input.enabled,
            description: defaults.description,
            updatedById: ctx.currentUser.id,
          },
          update: { enabled: input.enabled, updatedById: ctx.currentUser.id },
        });
        await tx.adminAuditLog.create({
          data: auditData({
            actorId: ctx.currentUser.id,
            action: "FEATURE_FLAG_UPDATED",
            entityType: "FEATURE_FLAG",
            entityId: input.key,
            metadata: { enabled: input.enabled },
          }),
        });
        return updated;
      });
      return flag;
    }),
});
