import { PrismaClient } from "../generated/prisma/index.js";
import { hostname, userInfo } from "node:os";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: pnpm admin:grant -- user@example.com");
  process.exit(1);
}

const db = new PrismaClient();
try {
  const target = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!target) {
    console.error(`No SadeCV user exists with email ${email}.`);
    process.exitCode = 1;
  } else {
    const operator = `${userInfo().username}@${hostname()}`;
    const audit = await db.adminAuditLog.create({
      data: {
        actorEmail: process.env.ADMIN_ACTOR_EMAIL,
        actorName: operator,
        action: "ADMIN_GRANTED_OFFLINE",
        entityType: "USER",
        entityId: target.id,
        status: "ATTEMPTED",
        metadataJson: JSON.stringify({ targetEmail: email, operator }),
      },
    });
    try {
      await db.user.update({
        where: { id: target.id },
        data: { role: "ADMIN", bannedAt: null, banReason: null },
      });
      await db.adminAuditLog.update({
        where: { id: audit.id },
        data: { status: "SUCCEEDED" },
      });
      console.log(`Granted ADMIN role to ${email}.`);
    } catch (error) {
      await db.adminAuditLog.update({
        where: { id: audit.id },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
        },
      });
      throw error;
    }
  }
} finally {
  await db.$disconnect();
}
