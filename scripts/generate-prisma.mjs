import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function readProviderFromDotEnv() {
  const envPath = join(projectRoot, ".env");
  if (!existsSync(envPath)) return undefined;

  const match = readFileSync(envPath, "utf8").match(
    /^DATABASE_PROVIDER\s*=\s*["']?([^"'\r\n]+)["']?/m,
  );
  return match?.[1]?.trim();
}

const provider =
  process.env.DATABASE_PROVIDER ?? readProviderFromDotEnv() ?? "sqlite";

if (provider !== "sqlite" && provider !== "postgresql") {
  console.error(
    `Unsupported DATABASE_PROVIDER "${provider}". Use "sqlite" or "postgresql".`,
  );
  process.exit(1);
}

const schema =
  provider === "postgresql"
    ? "prisma/schema.postgresql.prisma"
    : "prisma/schema.prisma";
const prismaCli = join(projectRoot, "node_modules", "prisma", "build", "index.js");
const result = spawnSync(
  process.execPath,
  [prismaCli, "generate", "--schema", schema],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);

