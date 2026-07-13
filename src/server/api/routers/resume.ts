import { randomUUID } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "../../../../generated/prisma";
import {
  createEmptyResumeContent,
  parseResumeContent,
  RESUME_SCHEMA_VERSION,
  resumeContentSchema,
  resumeDraftContentSchema,
  resumeTemplateSchema,
} from "~/lib/resume-model";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  consumeResumeGrant,
  getResumeEntitlement,
  hasPremiumAccess,
  PREMIUM_TEMPLATES,
} from "~/server/billing/entitlements";

const resumeSelect = {
  id: true,
  title: true,
  slug: true,
  template: true,
  accentColor: true,
  status: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const resumeRouter = createTRPCRouter({
  quota: protectedProcedure.query(({ ctx }) =>
    getResumeEntitlement(ctx.db, ctx.session.user.id),
  ),

  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.resume.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { updatedAt: "desc" },
      select: resumeSelect,
    }),
  ),

  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const resume = await ctx.db.resume.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!resume) throw new TRPCError({ code: "NOT_FOUND" });
      return resume;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1).max(120).default("Untitled CV"),
        template: resumeTemplateSchema.default("ATLAS"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const grantReference = randomUUID();

      try {
        return await ctx.db.$transaction(async (tx) => {
          const user = await tx.user.findUniqueOrThrow({
            where: { id: userId },
            select: { tier: true, tierStatus: true, tierExpiresAt: true },
          });
          if (
            PREMIUM_TEMPLATES.has(input.template) &&
            !hasPremiumAccess(user)
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "PREMIUM_TEMPLATE_REQUIRED",
            });
          }

          await consumeResumeGrant(tx, userId, grantReference);
          const nameParts = (ctx.session.user.name ?? "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          const content = createEmptyResumeContent({
            firstName: nameParts.shift() ?? "",
            lastName: nameParts.join(" "),
            email: ctx.session.user.email ?? "",
          });

          return tx.resume.create({
            data: {
              userId,
              title: input.title,
              template: input.template,
              slug: `${
                input.title
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "")
                  .slice(0, 40) || "cv"
              }-${randomUUID().slice(0, 8)}`,
              contentJson: JSON.stringify(content),
              contentSchemaVersion: RESUME_SCHEMA_VERSION,
            },
            select: resumeSelect,
          });
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "RESUME_QUOTA_EXCEEDED",
          });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        title: z.string().trim().min(1).max(120).optional(),
        template: resumeTemplateSchema.optional(),
        accentColor: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        content: resumeDraftContentSchema.optional(),
        isPublic: z.boolean().optional(),
        status: z.enum(["DRAFT", "READY", "ARCHIVED"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, content, ...data } = input;
      if (data.template && PREMIUM_TEMPLATES.has(data.template)) {
        const user = await ctx.db.user.findUniqueOrThrow({
          where: { id: ctx.session.user.id },
          select: { tier: true, tierStatus: true, tierExpiresAt: true },
        });
        if (!hasPremiumAccess(user)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "PREMIUM_TEMPLATE_REQUIRED",
          });
        }
      }

      if (data.status === "READY") {
        let contentToValidate = content;
        if (!contentToValidate) {
          const current = await ctx.db.resume.findFirst({
            where: { id, userId: ctx.session.user.id },
            select: { contentJson: true },
          });
          if (!current) throw new TRPCError({ code: "NOT_FOUND" });
          contentToValidate = parseResumeContent(current.contentJson);
        }
        const validation = resumeContentSchema.safeParse(contentToValidate);
        if (!validation.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "RESUME_VALIDATION_FAILED",
            cause: validation.error,
          });
        }
      }

      const result = await ctx.db.resume.updateMany({
        where: { id, userId: ctx.session.user.id },
        data: {
          ...data,
          ...(content
            ? {
                contentJson: JSON.stringify(content),
                contentSchemaVersion: RESUME_SCHEMA_VERSION,
              }
            : {}),
        },
      });

      if (!result.count) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const source = await ctx.db.resume.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });

      const grantReference = randomUUID();
      try {
        return await ctx.db.$transaction(async (tx) => {
          await consumeResumeGrant(tx, ctx.session.user.id, grantReference);
          return tx.resume.create({
            data: {
              userId: ctx.session.user.id,
              title: `${source.title} copy`,
              slug: `${source.slug.slice(0, 46)}-${randomUUID().slice(0, 8)}`,
              template: source.template,
              accentColor: source.accentColor,
              contentJson: source.contentJson,
              contentSchemaVersion: source.contentSchemaVersion,
              status: "DRAFT",
            },
            select: resumeSelect,
          });
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "RESUME_QUOTA_EXCEEDED",
          });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.resume.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!result.count) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
});
