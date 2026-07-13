process.argv.splice(2, 0, "generate");
await import("./prisma.mjs");
