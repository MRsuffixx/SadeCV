import { env } from "~/env";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
let valkeyClientPromise:
  Promise<Awaited<ReturnType<typeof createValkeyClient>>> | undefined;

async function createValkeyClient() {
  const { createClient } = await import("redis");
  const client = createClient({ url: env.VALKEY_URL });
  client.on("error", () => {
    // Requests fall back to the process-local limiter when Valkey is unavailable.
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
    const namespacedKey = `sadecv:limit:${key}`;
    const count = await client.incr(namespacedKey);
    if (count === 1) await client.expire(namespacedKey, windowSeconds);
    return count <= limit;
  } catch {
    valkeyClientPromise = undefined;
    return null;
  }
}

function checkMemory(
  key: string,
  limit: number,
  windowSeconds: number,
): boolean {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1_000,
    });
    return true;
  }

  bucket.count += 1;

  if (memoryBuckets.size > 10_000) {
    for (const [bucketKey, value] of memoryBuckets) {
      if (value.resetAt <= now) memoryBuckets.delete(bucketKey);
    }
  }

  return bucket.count <= limit;
}

export async function rateLimit(
  key: string,
  options: { limit: number; windowSeconds: number },
): Promise<boolean> {
  const distributed = await checkValkey(
    key,
    options.limit,
    options.windowSeconds,
  );

  return distributed ?? checkMemory(key, options.limit, options.windowSeconds);
}
