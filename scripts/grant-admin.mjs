import { PrismaClient } from "../generated/prisma/index.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: pnpm admin:grant -- user@example.com");
  process.exit(1);
}

const db = new PrismaClient();
try {
  const result = await db.user.updateMany({
    where: { email },
    data: { role: "ADMIN", bannedAt: null, banReason: null },
  });
  if (result.count !== 1) {
    console.error(`No SadeCV user exists with email ${email}.`);
    process.exitCode = 1;
  } else {
    console.log(`Granted ADMIN role to ${email}.`);
  }
} finally {
  await db.$disconnect();
}
