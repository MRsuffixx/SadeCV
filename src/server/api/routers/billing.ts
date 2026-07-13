import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { getResumeEntitlement } from "~/server/billing/entitlements";
import {
  createIyzicoDonationCheckout,
  createIyzicoSubscriptionCheckout,
  isIyzicoConfigured,
  isIyzicoDonationConfigured,
} from "~/server/payments/iyzico";
import {
  createStripeDonationCheckout,
  createStripeSubscriptionCheckout,
  isStripeDonationConfigured,
  isStripeSubscriptionConfigured,
} from "~/server/payments/stripe";
import { rateLimit } from "~/server/security/rate-limit";
import { getClientIp, verifyTurnstile } from "~/server/security/turnstile";

const providerSchema = z.enum(["STRIPE", "IYZICO"]);
const billingProfileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  surname: z.string().trim().min(1).max(80),
  identityNumber: z
    .string()
    .trim()
    .regex(/^\d{11}$/),
  gsmNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/),
  email: z.string().trim().email().max(254),
  address: z.string().trim().min(5).max(240),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80).default("Türkiye"),
  zipCode: z.string().trim().min(3).max(12),
});

function clientAddress(headers: Headers) {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function assertTrustedOrigin(headers: Headers) {
  const origin = headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(env.APP_DOMAIN).origin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "UNTRUSTED_ORIGIN" });
  }
}

export const billingRouter = createTRPCRouter({
  providers: publicProcedure.query(() => ({
    subscription: {
      stripe: isStripeSubscriptionConfigured(),
      iyzico: isIyzicoConfigured(),
    },
    donation: {
      stripe: isStripeDonationConfigured(),
      iyzico: isIyzicoDonationConfigured(),
    },
  })),

  entitlements: protectedProcedure.query(({ ctx }) =>
    getResumeEntitlement(ctx.db, ctx.session.user.id),
  ),

  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        provider: providerSchema,
        billingProfile: billingProfileSchema.optional(),
        turnstileToken: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertTrustedOrigin(ctx.headers);
      const allowed = await rateLimit(`subscription:${ctx.session.user.id}`, {
        limit: 5,
        windowSeconds: 300,
      });
      if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      if (
        !(await verifyTurnstile(input.turnstileToken, getClientIp(ctx.headers)))
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_VERIFICATION_FAILED",
        });
      }

      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: ctx.session.user.id },
        select: {
          id: true,
          email: true,
          stripeCustomerId: true,
          tier: true,
          tierStatus: true,
          tierExpiresAt: true,
        },
      });
      const entitlement = await getResumeEntitlement(ctx.db, user.id);
      if (entitlement.isPremium) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "SUBSCRIPTION_ALREADY_ACTIVE",
        });
      }

      if (input.provider === "STRIPE") {
        if (!isStripeSubscriptionConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED" });
        }
        return {
          provider: input.provider,
          ...(await createStripeSubscriptionCheckout({
            userId: user.id,
            email: user.email,
            customerId: user.stripeCustomerId,
          })),
          checkoutFormContent: null,
        };
      }

      if (!isIyzicoConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }
      if (!input.billingProfile) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "IYZICO_BILLING_PROFILE_REQUIRED",
        });
      }
      const checkout = await createIyzicoSubscriptionCheckout({
        userId: user.id,
        profile: input.billingProfile,
      });
      return {
        provider: input.provider,
        sessionId: checkout.token,
        ...checkout,
      };
    }),

  createDonationCheckout: publicProcedure
    .input(
      z.object({
        provider: providerSchema,
        amount: z.number().int().min(100).max(500_000),
        currency: z.enum(["USD", "EUR", "TRY"]),
        email: z.string().trim().email().max(254).optional(),
        billingProfile: billingProfileSchema.optional(),
        turnstileToken: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertTrustedOrigin(ctx.headers);
      const ip = clientAddress(ctx.headers);
      const allowed = await rateLimit(`donation:${ip}`, {
        limit: 10,
        windowSeconds: 600,
      });
      if (!allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      if (!(await verifyTurnstile(input.turnstileToken, ip))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_VERIFICATION_FAILED",
        });
      }
      if (input.provider === "IYZICO" && input.currency !== "TRY") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "IYZICO_REQUIRES_TRY",
        });
      }

      const donation = await ctx.db.donation.create({
        data: {
          userId: ctx.session?.user?.id,
          provider: input.provider,
          amount: input.amount,
          currency: input.currency,
          supporterEmail: input.billingProfile?.email ?? input.email,
        },
      });

      try {
        if (input.provider === "STRIPE") {
          if (!isStripeDonationConfigured()) {
            throw new TRPCError({ code: "PRECONDITION_FAILED" });
          }
          const checkout = await createStripeDonationCheckout({
            donationId: donation.id,
            userId: ctx.session?.user?.id,
            email: input.email,
            amount: input.amount,
            currency: input.currency,
          });
          await ctx.db.donation.update({
            where: { id: donation.id },
            data: { providerSessionId: checkout.sessionId },
          });
          return { provider: input.provider, ...checkout };
        }

        if (!isIyzicoDonationConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED" });
        }
        if (!input.billingProfile) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "IYZICO_BILLING_PROFILE_REQUIRED",
          });
        }
        const checkout = await createIyzicoDonationCheckout({
          donationId: donation.id,
          amount: input.amount,
          ip,
          profile: input.billingProfile,
        });
        await ctx.db.donation.update({
          where: { id: donation.id },
          data: { providerSessionId: checkout.token },
        });
        return {
          provider: input.provider,
          sessionId: checkout.token,
          url: checkout.url,
        };
      } catch (error) {
        await ctx.db.donation.update({
          where: { id: donation.id },
          data: { status: "FAILED" },
        });
        throw error;
      }
    }),
});
