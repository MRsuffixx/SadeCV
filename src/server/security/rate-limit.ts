import "server-only";

import { createHash } from "node:crypto";

import { env } from "~/env";
import { db } from "~/server/db";

let valkeyClientPromise:
  | Promise<Awaited<ReturnType<typeof createValkeyClient>>>
  | undefined;

function storageKey(key: string) {
  return createHash("sha256")
    .update(`sadecv:limit:${key}`, "utf8")
    .digest("hex");
}

async function createValkeyClient() {
  const { createClient } = await import("redis");
  const client = createClient({ url: env.VALKEY_URL });
  client.on("error", () => {
    // The database fallback remains available if this connection drops.
  });
  await client.connect();
  return client;
}

async function checkValkey(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean | null> {
  if (!env.VALKEY_URL) return null;

  try {
    valkeyClientPromise ??= createValkeyClient();
    const client = await valkeyClientPromise;
    const count = await client.eval(
      "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count;",
      {
        keys: [key],
        arguments: [String(windowSeconds)],
      },
    );
    return Number(count) <= limit;
  } catch {
    valkeyClientPromise = undefined;
    return null;
  }
}

async function checkDatabase(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const now = new Date();
  const nextResetAt = new Date(now.getTime() + windowSeconds * 1_000);

  return db.$transaction(async (tx) => {
    // This write obtains a row lock on PostgreSQL and participates in SQLite's
    // serialized writer lock. All readers below therefore observe one counter
    // transition at a time, including when a window rolls over.
    await tx.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 0, resetAt: nextResetAt },
      update: { updatedAt: now },
    });
    const bucket = await tx.rateLimitBucket.findUniqueOrThrow({
      where: { key },
    });
    const expired = bucket.resetAt <= now;
    const count = expired ? 1 : bucket.count + 1;

    await tx.rateLimitBucket.update({
      where: { key },
      data: {
        count,
        ...(expired ? { resetAt: nextResetAt } : {}),
      },
    });
    return count <= limit;
  });
}

export async function rateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): Promise<boolean> {
  const keyHash = storageKey(key);
  const distributed = await checkValkey(
    keyHash,
    options.limit,
    options.windowSeconds,
  );
  if (distributed !== null) return distributed;

  try {
    return await checkDatabase(
      keyHash,
      options.limit,
      options.windowSeconds,
    );
  } catch (error) {
    console.error("Rate limiter storage failed", {
      error: error instanceof Error ? error.message : "Unknown storage error",
    });
    // Security-sensitive operations must not become unlimited when shared
    // storage is unavailable.
    return false;
  }
}
