import { NextResponse } from "next/server";

import { env } from "~/env";
import { db } from "~/server/db";
import { reconcileExpiredPlans } from "~/server/payments/sync";

export const runtime = "nodejs";

async function handle(request: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await reconcileExpiredPlans(db));
}

export const GET = handle;
export const POST = handle;
