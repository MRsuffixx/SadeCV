import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import { rateLimit } from "~/server/security/rate-limit";
import { getClientIp, verifyTurnstile } from "~/server/security/turnstile";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      tier: string;
      role: "USER" | "ADMIN";
      banned: boolean;
      locale: "en" | "tr";
    } & DefaultSession["user"];
  }
}

type SadeJwtClaims = {
  authRefreshedAt?: number;
  locale?: "en" | "tr";
};

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
  turnstileToken: z.string().min(1),
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      turnstileToken: { label: "Turnstile token", type: "text" },
    },
    async authorize(rawCredentials, request) {
      const parsed = credentialsSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;

      const ip = getClientIp(request.headers);
      const allowed = await rateLimit(`auth:login:${ip}:${parsed.data.email}`, {
        limit: 8,
        windowSeconds: 15 * 60,
      });
      if (!allowed) return null;

      const isHuman = await verifyTurnstile(parsed.data.turnstileToken, ip);
      if (!isHuman) return null;

      const user = await db.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (!user?.passwordHash || !user.emailVerified || user.bannedAt) {
        return null;
      }
      const validPassword = await compare(
        parsed.data.password,
        user.passwordHash,
      );

      return validPassword ? user : null;
    },
  }),
];

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  );
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers,
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    signIn: ({ account, profile }) =>
      account?.provider !== "google" || profile?.email_verified === true,
    jwt: async ({ token, user, trigger }) => {
      const claims = token as typeof token & SadeJwtClaims;
      if (user) {
        token.id = user.id;
        token.tier = "tier" in user ? String(user.tier) : "FREE";
        token.role =
          "role" in user && user.role === "ADMIN" ? "ADMIN" : "USER";
        token.banned = "bannedAt" in user && Boolean(user.bannedAt);
        claims.locale =
          "locale" in user && user.locale === "tr" ? "tr" : "en";
        claims.authRefreshedAt = Date.now();
      } else if (
        typeof token.id === "string" &&
        (trigger === "update" ||
          !claims.authRefreshedAt ||
          Date.now() - claims.authRefreshedAt > 5 * 60 * 1_000)
      ) {
        const currentUser = await db.user.findUnique({
          where: { id: token.id },
          select: { tier: true, role: true, bannedAt: true, locale: true },
        });
        token.tier = currentUser?.tier ?? "FREE";
        token.role = currentUser?.role === "ADMIN" ? "ADMIN" : "USER";
        token.banned = !currentUser || Boolean(currentUser.bannedAt);
        claims.locale = currentUser?.locale === "tr" ? "tr" : "en";
        claims.authRefreshedAt = Date.now();
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: typeof token.id === "string" ? token.id : (token.sub ?? ""),
        tier: typeof token.tier === "string" ? token.tier : "FREE",
        role: token.role === "ADMIN" ? "ADMIN" : "USER",
        banned: Boolean(token.banned),
        locale:
          (token as typeof token & SadeJwtClaims).locale === "tr"
            ? "tr"
            : "en",
      },
    }),
  },
  events: {
    signIn: async ({ user, account }) => {
      if (user.id) {
        await db.user.updateMany({
          where: { id: user.id, bannedAt: null },
          data: {
            lastLoginAt: new Date(),
            ...(account?.provider === "google"
              ? { emailVerified: new Date() }
              : {}),
          },
        });
      }
    },
  },
} satisfies NextAuthConfig;
