import { randomUUID } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "../../../../generated/prisma";
import {
  createEmptyResumeContent,
  parseResumeContent,
  ResumeContentParseError,
  RESUME_SCHEMA_VERSION,
  resumeContentSchema,
  resumeDraftContentSchema,
  resumeTemplateSchema,
} from "~/lib/resume-model";
import { resumeThemeSchema } from "~/templates/schema";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  consumeResumeGrant,
  getResumeEntitlement,
  hasPremiumAccess,
  PREMIUM_TEMPLATES,
  ResumeQuotaExceededError,
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
          error instanceof ResumeQuotaExceededError ||
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002")
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
        theme: resumeThemeSchema.optional(),
        content: resumeDraftContentSchema.optional(),
        isPublic: z.boolean().optional(),
        status: z.enum(["DRAFT", "READY", "ARCHIVED"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, content, theme, ...data } = input;
      return ctx.db.$transaction(async (tx) => {
        const [existing, user] = await Promise.all([
          tx.resume.findFirst({
            where: { id, userId: ctx.session.user.id },
            select: {
              template: true,
              contentJson: true,
              contentSchemaVersion: true,
            },
          }),
          tx.user.findUniqueOrThrow({
            where: { id: ctx.session.user.id },
            select: { tier: true, tierStatus: true, tierExpiresAt: true },
          }),
        ]);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

        const targetTemplate = resumeTemplateSchema.parse(
          data.template ?? existing.template,
        );
        const premiumPreviewOnly =
          PREMIUM_TEMPLATES.has(targetTemplate) && !hasPremiumAccess(user);
        if (
          premiumPreviewOnly &&
          (data.status === "READY" || data.isPublic === true)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "PREMIUM_TEMPLATE_REQUIRED",
          });
        }
        const guardedData = premiumPreviewOnly
          ? { ...data, status: "DRAFT" as const, isPublic: false }
          : data;

        if (guardedData.status === "READY") {
          let contentToValidate = content;
          if (!contentToValidate) {
            try {
              contentToValidate = parseResumeContent(existing.contentJson);
            } catch (error) {
              if (error instanceof ResumeContentParseError) {
                throw new TRPCError({
                  code: "CONFLICT",
                  message: "STORED_RESUME_CONTENT_INVALID",
                });
              }
              throw error;
            }
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

        const nextContentJson = content ? JSON.stringify(content) : null;
        if (nextContentJson && nextContentJson !== existing.contentJson) {
          await tx.resumeVersion.create({
            data: {
              resumeId: id,
              contentJson: existing.contentJson,
              contentSchemaVersion: existing.contentSchemaVersion,
              label: "Before save",
            },
          });
        }

        const result = await tx.resume.updateMany({
          where: { id, userId: ctx.session.user.id },
          data: {
            ...guardedData,
            ...(theme
              ? {
                  accentColor: theme.accentColor,
                  themeJson: JSON.stringify(theme),
                }
              : {}),
            ...(nextContentJson
              ? {
                  contentJson: nextContentJson,
                  contentSchemaVersion: RESUME_SCHEMA_VERSION,
                }
              : {}),
          },
        });

        if (!result.count) throw new TRPCError({ code: "NOT_FOUND" });
        return { success: true };
      });
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
              themeJson: source.themeJson,
              contentJson: source.contentJson,
              contentSchemaVersion: source.contentSchemaVersion,
              status: "DRAFT",
            },
            select: resumeSelect,
          });
        });
      } catch (error) {
        if (
          error instanceof ResumeQuotaExceededError ||
          (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002")
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
