import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { isValidBillingIdentity } from "~/lib/identity";
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
  iyzicoTokenHash,
} from "~/server/payments/iyzico";
import {
  createStripeDonationCheckout,
  createStripeSubscriptionCheckout,
  isStripeDonationConfigured,
  isStripeSubscriptionConfigured,
} from "~/server/payments/stripe";
import { rateLimit } from "~/server/security/rate-limit";
import { assertTrustedOrigin } from "~/server/security/origin";
import { getClientIp, verifyTurnstile } from "~/server/security/turnstile";

const providerSchema = z.enum(["STRIPE", "IYZICO"]);
const billingProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    surname: z.string().trim().min(1).max(80),
    identityNumber: z.string().trim().min(5).max(50),
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
  })
  .strict()
  .superRefine((profile, ctx) => {
    if (!isValidBillingIdentity(profile.identityNumber, profile.country)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identityNumber"],
        message:
          "Enter a valid Turkish identity number or a 5–50 character passport number.",
      });
    }
  });

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
      await ctx.db.paymentCheckout.create({
        data: {
          provider: "IYZICO",
          kind: "SUBSCRIPTION",
          tokenHash: iyzicoTokenHash(checkout.token),
          referenceId: user.id,
          expiresAt: checkout.expiresAt,
        },
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
      const ip = getClientIp(ctx.headers);
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

      if (input.provider === "STRIPE" && !isStripeDonationConfigured()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }
      if (input.provider === "IYZICO") {
        if (!isIyzicoDonationConfigured()) {
          throw new TRPCError({ code: "PRECONDITION_FAILED" });
        }
        if (!input.billingProfile) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "IYZICO_BILLING_PROFILE_REQUIRED",
          });
        }
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

        const checkout = await createIyzicoDonationCheckout({
          donationId: donation.id,
          amount: input.amount,
          ip,
          profile: input.billingProfile!,
        });
        const correlation = await ctx.db.$transaction(async (tx) => {
          const paymentCheckout = await tx.paymentCheckout.create({
            data: {
              provider: "IYZICO",
              kind: "DONATION",
              tokenHash: iyzicoTokenHash(checkout.token),
              referenceId: donation.id,
              expiresAt: checkout.expiresAt,
            },
          });
          await tx.donation.update({
            where: { id: donation.id },
            data: { providerSessionId: paymentCheckout.id },
          });
          return paymentCheckout;
        });
        return {
          provider: input.provider,
          sessionId: correlation.id,
          url: checkout.url,
        };
      } catch (error) {
        console.error("Donation checkout initialization failed", {
          donationId: donation.id,
          provider: input.provider,
          error:
            error instanceof Error ? error.message : "Unknown provider error",
        });
        // Keep the PENDING row. Provider session creation can succeed even when
        // the response is lost; a later signed webhook can still reconcile it.
        throw error;
      }
    }),
});
