import { renderToBuffer } from "@react-pdf/renderer";
import { type NextRequest } from "next/server";
import { createElement } from "react";
import { z } from "zod";

import { env } from "~/env";
import { resumeDraftContentSchema } from "~/lib/resume-model";
import { auth } from "~/server/auth";
import { hasPremiumAccess } from "~/server/billing/entitlements";
import { db } from "~/server/db";
import { rateLimit } from "~/server/security/rate-limit";
import { isFeatureEnabled } from "~/server/system/feature-flags";
import { ResumePdfDocument } from "~/templates/pdf/resume-pdf-document";
import { isPremiumTemplate } from "~/templates/registry";
import {
  resumeTemplateIdSchema,
  resumeThemeSchema,
} from "~/templates/schema";

export const runtime = "nodejs";

const exportSchema = z.object({
  title: z.string().trim().min(1).max(120),
  template: resumeTemplateIdSchema,
  theme: resumeThemeSchema,
  content: resumeDraftContentSchema,
});

function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "sadecv"
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resumeId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(env.APP_DOMAIN).origin) {
    return Response.json({ error: "UNTRUSTED_ORIGIN" }, { status: 403 });
  }
  if (
    !(await rateLimit(`pdf:${session.user.id}`, {
      limit: 20,
      windowSeconds: 60,
    }))
  ) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
  }
  if (!(await isFeatureEnabled(db, "PDF_GENERATION"))) {
    return Response.json({ error: "PDF_GENERATION_DISABLED" }, { status: 503 });
  }

  const [{ resumeId }, body] = await Promise.all([
    context.params,
    request.json().catch(() => null),
  ]);
  const input = exportSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      { error: "INVALID_RESUME_DATA", issues: input.error.flatten() },
      { status: 400 },
    );
  }

  const [resume, user] = await Promise.all([
    db.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
      select: { id: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        tier: true,
        tierStatus: true,
        tierExpiresAt: true,
        bannedAt: true,
      },
    }),
  ]);
  if (!resume) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!user || user.bannedAt) {
    return Response.json({ error: "ACCOUNT_DISABLED" }, { status: 403 });
  }
  if (
    isPremiumTemplate(input.data.template) &&
    !hasPremiumAccess(user)
  ) {
    return Response.json(
      { error: "PREMIUM_TEMPLATE_REQUIRED" },
      { status: 402 },
    );
  }

  const document = createElement(ResumePdfDocument, {
    data: input.data,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(document);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename(input.data.title)}.pdf"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
