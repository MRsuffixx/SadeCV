import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    EMAIL_FROM: z.string().trim().min(3).max(254).optional(),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    DATABASE_URL: z.string().min(1),
    DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),
    VALKEY_URL: z.string().url().optional(),
    TRUSTED_PROXY_MODE: z
      .enum(["none", "cloudflare", "platform"])
      .default("none"),
    CRON_SECRET: z.string().min(32).optional(),
    APP_DOMAIN: z.string().url().default("http://localhost:3000"),
    APP_PORT: z.coerce.number().int().positive().default(3000),
    UPLOADTHING_TOKEN: z.preprocess(
      (value) =>
        typeof value === "string" && value.startsWith("sk_")
          ? undefined
          : value,
      z.string().min(1).optional(),
    ),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    STRIPE_PREMIUM_PRICE_ID: z.string().startsWith("price_").optional(),
    IYZICO_API_KEY: z.string().optional(),
    IYZICO_SECRET_KEY: z.string().optional(),
    IYZICO_MERCHANT_ID: z.string().optional(),
    IYZICO_BASE_URL: z.string().url().optional(),
    IYZICO_PREMIUM_PLAN_REFERENCE_CODE: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_PROVIDER: process.env.DATABASE_PROVIDER,
    VALKEY_URL: process.env.VALKEY_URL,
    TRUSTED_PROXY_MODE: process.env.TRUSTED_PROXY_MODE,
    CRON_SECRET: process.env.CRON_SECRET,
    APP_DOMAIN: process.env.APP_DOMAIN,
    APP_PORT: process.env.APP_PORT,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
    IYZICO_API_KEY: process.env.IYZICO_API_KEY,
    IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY,
    IYZICO_MERCHANT_ID: process.env.IYZICO_MERCHANT_ID,
    IYZICO_BASE_URL: process.env.IYZICO_BASE_URL,
    IYZICO_PREMIUM_PLAN_REFERENCE_CODE:
      process.env.IYZICO_PREMIUM_PLAN_REFERENCE_CODE,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
