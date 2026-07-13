import { randomUUID } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
        template: z.enum(["ATLAS", "MONO", "EDITORIAL"]).default("ATLAS"),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.resume.create({
        data: {
          userId: ctx.session.user.id,
          title: input.title,
          template: input.template,
          slug: `${input.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 40) || "cv"}-${randomUUID().slice(0, 8)}`,
          contentJson: JSON.stringify({
            basics: {
              name: ctx.session.user.name ?? "",
              email: ctx.session.user.email ?? "",
              headline: "",
              summary: "",
            },
            experience: [],
            education: [],
            skills: [],
          }),
        },
        select: resumeSelect,
      }),
    ),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        title: z.string().trim().min(1).max(120).optional(),
        template: z.enum(["ATLAS", "MONO", "EDITORIAL"]).optional(),
        accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        contentJson: z.string().max(500_000).optional(),
        isPublic: z.boolean().optional(),
        status: z.enum(["DRAFT", "READY", "ARCHIVED"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const result = await ctx.db.resume.updateMany({
        where: { id, userId: ctx.session.user.id },
        data,
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

      return ctx.db.resume.create({
        data: {
          userId: ctx.session.user.id,
          title: `${source.title} copy`,
          slug: `${source.slug.slice(0, 46)}-${randomUUID().slice(0, 8)}`,
          template: source.template,
          accentColor: source.accentColor,
          contentJson: source.contentJson,
          status: "DRAFT",
        },
        select: resumeSelect,
      });
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

