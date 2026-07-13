import "server-only";

import type { Prisma, PrismaClient } from "../../../generated/prisma";

export const FEATURE_FLAGS = {
  MAINTENANCE_MODE: {
    enabled: false,
    description: "Show the maintenance screen to non-admin visitors.",
  },
  PDF_GENERATION: {
    enabled: true,
    description: "Allow users to generate and download PDF resumes.",
  },
  REGISTRATION: {
    enabled: true,
    description: "Allow new users to register an account.",
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export async function isFeatureEnabled(
  db: DatabaseClient,
  key: FeatureFlagKey,
) {
  const flag = await db.featureFlag.findUnique({ where: { key } });
  return flag?.enabled ?? FEATURE_FLAGS[key].enabled;
}

export async function listFeatureFlags(db: DatabaseClient) {
  const stored = await db.featureFlag.findMany();
  const byKey = new Map(stored.map((flag) => [flag.key, flag]));

  return Object.entries(FEATURE_FLAGS).map(([key, defaults]) => {
    const existing = byKey.get(key);
    return {
      key: key as FeatureFlagKey,
      enabled: existing?.enabled ?? defaults.enabled,
      description: existing?.description ?? defaults.description,
      updatedAt: existing?.updatedAt ?? null,
    };
  });
}
