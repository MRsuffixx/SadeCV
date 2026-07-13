import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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

const cliArgs = process.argv.slice(2);
const providerArgument = cliArgs.find((argument) =>
  argument.startsWith("--provider="),
);
const provider =
  providerArgument?.slice("--provider=".length) ??
  process.env.DATABASE_PROVIDER ??
  readProviderFromDotEnv() ??
  "sqlite";
const prismaArgs = cliArgs.filter(
  (argument) => !argument.startsWith("--provider="),
);

if (provider !== "sqlite" && provider !== "postgresql") {
  console.error(
    `Unsupported DATABASE_PROVIDER "${provider}". Use "sqlite" or "postgresql".`,
  );
  process.exit(1);
}

if (!prismaArgs.length) {
  console.error("Pass a Prisma command, for example: generate or db push.");
  process.exit(1);
}

const schema =
  provider === "postgresql"
    ? "prisma/schema.postgresql.prisma"
    : "prisma/schema.prisma";
const prismaCli = join(projectRoot, "node_modules", "prisma", "build", "index.js");
const result = spawnSync(
  process.execPath,
  [prismaCli, ...prismaArgs, "--schema", schema],
  {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_PROVIDER: provider },
    encoding: "utf8",
  },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.status === 0) process.exit(0);

const failureOutput = [result.error?.message, result.stderr]
  .filter(Boolean)
  .join("\n");
const lockedEngineRename = failureOutput.match(
  /EPERM:[\s\S]*?rename '([^']+query_engine-windows\.dll\.node\.tmp\d+)' -> '([^']+query_engine-windows\.dll\.node)'/,
);

if (process.platform === "win32" && lockedEngineRename) {
  const [, temporaryEngine, installedEngine] = lockedEngineRename;
  if (
    temporaryEngine &&
    installedEngine &&
    existsSync(temporaryEngine) &&
    existsSync(installedEngine)
  ) {
    const digest = (path) =>
      createHash("sha256").update(readFileSync(path)).digest("hex");

    if (digest(temporaryEngine) === digest(installedEngine)) {
      console.warn(
        "Prisma's identical Windows query engine is locked; using the generated client and installed engine.",
      );
      process.exit(0);
    }
  }
}

process.exit(result.status ?? 1);
