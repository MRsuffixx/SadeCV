# Project Overview

SadeCV is a single-tenant SaaS web application that lets professionals author, manage, and export polished résumés
as PDF documents. It combines an interactive CV editor, live DOM preview, server-side PDF rendering, plan &
quota management, Stripe/iyzico payments, file uploads, an admin console and security controls inside one Next.js
15 (App Router) codebase. The codebase is **source-available, not open source**; see [LICENSE](./LICENSE) before
running, cloning, or distributing it.

# Repository Structure

- `.agents/` – Reserved for local agent configuration (currently empty).
- `.github/` – Issue/PR templates, Dependabot config, CODEOWNERS and the GitHub Actions CI workflow.
- `prisma/` – Prisma schemas; ships both SQLite (`schema.prisma`) and PostgreSQL (`schema.postgresql.prisma`).
- `public/` – Static assets: favicon and Open Graph image.
- `scripts/` – Node helpers: `generate-prisma.mjs` (provider-aware client generation) and `grant-admin.mjs`.
- `src/app/` – Next.js App Router pages, layouts, route handlers (`/api/*`) and middleware.
- `src/lib/` – Shared client/server libraries, including the Zod-validated CV content model.
- `src/server/` – Server-only code: tRPC routers, Auth.js config, billing/payments, security, feature flags,
  Prisma client and UploadThing router.
- `src/styles/` – Tailwind 4 entry point and theme tokens.
- `src/templates/` – Resume template registry with paired `dom/` (live preview) and `pdf/` renderers.
- `src/trpc/` – tRPC React Query client and the RSC server caller.
- `src/types/` – Type augmentations for third-party packages.
- `src/utils/` – Small client-side helpers (formatters, hooks).
- `src/env.js` – Zod-validated environment schema built on `@t3-oss/env-nextjs`.
- `src/middleware.ts` – Edge middleware enforcing auth, admin gating and maintenance mode.
- `generated/` – Output directory for the provider-specific Prisma Client (gitignored).
- `tmp/`, `.next/`, `.pnpm-store/`, `node_modules/` – Build, cache and dependency directories (gitignored).

# Build & Development Commands

All commands run from the repository root and use **pnpm 11.9.0** (pinned via `packageManager`) on **Node.js
24.15.0** (pinned via `.node-version`). Enable the toolchain with `corepack enable && corepack prepare
pnpm@11.9.0 --activate` before the first run.

```bash
# Install dependencies (postinstall regenerates the Prisma client).
pnpm install

# Start the Turbopack-powered dev server (default http://localhost:3000).
pnpm dev

# Build for production (also regenerates the Prisma client for the selected provider).
pnpm build

# Run the production server (after `pnpm build`).
pnpm start

# Build and run in one go (preview mode).
pnpm preview
```

```bash
# Lint, format and type-check.
pnpm lint            # ESLint only
pnpm lint:fix        # ESLint with --fix
pnpm typecheck       # tsc --noEmit
pnpm check           # ESLint + tsc --noEmit  (CI gate)
pnpm format:check    # Prettier check
pnpm format:write    # Prettier write
```

```bash
# Database (choose the SQLite or postgres variant; the default helper targets SQLite).
pnpm db:generate:client      # node scripts/generate-prisma.mjs
pnpm db:generate             # prisma migrate dev (SQLite)
pnpm db:generate:postgres    # prisma generate --schema prisma/schema.postgresql.prisma
pnpm db:push                 # prisma db push (SQLite)
pnpm db:push:postgres        # prisma db push --schema prisma/schema.postgresql.prisma
pnpm db:migrate              # prisma migrate deploy (SQLite)
pnpm db:migrate:postgres     # prisma migrate deploy (PostgreSQL)
pnpm db:studio               # Prisma Studio GUI
```

```bash
# Operations.
pnpm admin:grant -- <email>   # Promote an existing user to ADMIN (uses --env-file=.env).
```

> TODO: There is currently no `pnpm test` command. The CI gate is `pnpm install --frozen-lockfile && pnpm check
> && pnpm build`. Add a test runner here when the test suite is introduced.

# Code Style & Conventions

- **Formatter**: Prettier 3 with `prettier-plugin-tailwindcss`; default 100-column wrap, double quotes
  inherited from the Next.js preset.
- **Editor**: `.editorconfig` enforces UTF-8, LF line endings, final newline and 2-space indents (Markdown
  preserves trailing whitespace).
- **TypeScript**: `strict` and `noUncheckedIndexedAccess` are on; avoid `any`. ESLint uses `typescript-eslint`
  recommended + recommended-type-checked + stylistic-type-checked; unused vars are warnings
  (`argsIgnorePattern: "^_"`); unused-disable reports are promoted; unused imports must use `import type`.
- **Imports**: Use the `~/*` path alias that maps to `./src/*`. Keep the import order conventional (libs,
  then `@/` aliased, then relative). Client components only when interaction or browser APIs are required.
- **Naming**: PascalCase for React components, camelCase for variables/functions, kebab-case for branch names.
- **Validation**: All external/API/form input must be parsed with a Zod schema; CV content is the
  single source of truth at `src/lib/resume-model.ts` (`schemaVersion: 3`, max 500 KB JSON).
- **Environment variables**: declare every new variable in both `src/env.js` (server or client split) and
  `.env.example`; empty strings are coerced to `undefined`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`). Optional scope mirrors
  the area, e.g. `feat(resume): add template option`, `fix(auth): reject banned sessions`,
  `chore(deps): update prisma`.
- **Branches**: Short topical names: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `refactor/<topic>`,
  `chore/<topic>`.
- **PRs**: One logical change per commit/PR; document DB/env/security/payment/deployment impact, migration
  steps, and attach screenshots for user-visible changes.

# Architecture Notes

```mermaid
flowchart LR
  B[Browser] --> RSC[Next.js App Router]
  B --> TRPC[/api/trpc]
  B --> PDF[/api/resumes/:id/pdf]
  B --> UP[/api/uploadthing]

  RSC --> AUTH[Auth.js v5]
  RSC --> CALLER[tRPC server caller]
  TRPC --> ROUTERS[tRPC routers]
  PDF --> PDFR[React PDF renderer]
  CALLER --> ROUTERS
  ROUTERS --> DB[(Prisma: SQLite or PostgreSQL)]
  AUTH --> DB
  PDF --> DB
  UP --> UT[UploadThing v7]
  ROUTERS --> STRIPE[Stripe]
  ROUTERS --> IYZICO[iyzico]
  WH[/api/webhooks/checkout] --> STRIPE
  WH --> IYZICO
  WH --> DB
  ROUTERS --> RL[Valkey or in-memory rate limit]
```

- **Edge layer**: `src/middleware.ts` enforces auth, `ADMIN` role for `/admin/*` and the
  `MAINTENANCE_MODE` feature flag before a request reaches a route handler or RSC.
- **Rendering**: React Server Components fetch the session and first paint data server-side; client islands
  talk to tRPC over an HTTP batch-stream connection.
- **Data**: All persistence flows through the Prisma Client in `src/server/db.ts`; the active schema is
  chosen by `DATABASE_PROVIDER` (`sqlite` default, `postgresql` for prod). `scripts/generate-prisma.mjs`
  generates the matching client into `generated/prisma` at `postinstall` and `build`.
- **Payments**: Stripe and iyzico share the `/api/webhooks/checkout` endpoint; iyzico additionally uses
  `/api/payments/iyzico/callback`. Both providers perform signature verification and write `PaymentEvent`
  rows for idempotency; subscription/transaction writes happen inside Prisma transactions.
- **PDF pipeline**: `POST /api/resumes/:id/pdf` re-checks session, ownership, `PDF_GENERATION` flag, rate
  limit and Premium-template access, then renders through `@react-pdf/renderer` with
  `Cache-Control: private, no-store` and an origin check.
- **AuthZ model**: `publicProcedure`, `protectedProcedure`, `protectedAdminProcedure` tRPC helpers
  enforce authentication, ban status, role and ownership; admin actions write `AdminAuditLog` entries.

# Testing Strategy

- **Unit / integration / e2e**: not yet implemented. There is no `pnpm test` script and no test framework
  configured in `package.json`.
- **Current quality gate** (run locally and required by `.github/workflows/ci.yml`):

  ```bash
  pnpm install --frozen-lockfile
  pnpm check      # ESLint + tsc --noEmit
  pnpm build      # prisma client regen + next build
  ```

- **Manual verification**: when changing user-visible behavior or any payment/auth flow, list the manual
  steps in the PR description (see `CONTRIBUTING.md`).
- **CI**: `.github/workflows/ci.yml` runs on `push` and `pull_request` against `main`, with concurrency
  cancellation per ref and a 20-minute job timeout.

> TODO: When a test runner is added, document the unit, integration and e2e commands and how to execute
> them locally and in CI here.

# Security & Compliance

- **License**: Source-available (see `LICENSE`). No permission to download, run, modify, host or distribute
  without prior written approval from the Licensor. The SadeCV name/logo/branding are **not** licensed.
- **Secrets**: Never commit `.env`, API keys, webhook secrets, session tokens or user PII. Source them
  through `src/env.js` (`@t3-oss/env-nextjs`). `AUTH_SECRET`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_MERCHANT_ID`,
  `TURNSTILE_SECRET_KEY` and `UPLOADTHING_TOKEN` must be provided at runtime.
- **Auth**: Auth.js v5 with JWT sessions, Prisma adapter, bcrypt (12 rounds), email normalization for
  Credentials login, optional Google OAuth (only when both OAuth env vars are set).
- **Bot & abuse**: Cloudflare Turnstile verification on registration and login, identity/IP rate limiting
  backed by Valkey/Redis (falls back to in-process memory when `VALKEY_URL` is unset).
- **Webhook integrity**: Stripe signature verification and iyzico `x-iyz-signature-v3` verification on
  shared `/api/webhooks/checkout`; iyzico hosted checkout callbacks land on
  `/api/payments/iyzico/callback`. Idempotency is enforced through `PaymentEvent` records.
- **Transport & headers**: origin checks on PDF responses, `Content-Security-Policy`, HSTS, `nosniff`,
  frame denial and a restricted Permissions Policy. PDF responses use `Cache-Control: private, no-store`.
- **Dependency scanning**: `.github/dependabot.yml` is configured; review Dependabot PRs with the same
  quality gate. Third-party packages remain under their own licenses.
- **Vulnerability reports**: do **not** open public issues. Follow the private process in
  [`SECURITY.md`](./SECURITY.md) and email `hello@sadecv.com` with `[SECURITY]` in the subject.

# Agent Guardrails

- **Never touch**:
  - `.env`, `.env.*.local`, `.pnpm-store/`, `generated/prisma/**` (regenerate via `pnpm db:generate:client`).
  - `prisma/db.sqlite` or any production database dumps.
  - `LICENSE`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/CODEOWNERS` unless the change is explicitly
    requested.
  - Any file under `tmp/` or `.next/` (transient build output).
- **Required before committing**:
  1. `pnpm check` passes locally.
  2. `pnpm build` succeeds for the active `DATABASE_PROVIDER`.
  3. When editing `prisma/schema*.prisma`, update **both** schemas and regenerate the client.
  4. When adding env vars, update `src/env.js` and `.env.example` together.
  5. Do not log or print secrets, tokens, passwords or personal data.
- **Required reviews**:
  - Any change under `src/server/security/**`, `src/server/payments/**`, `src/server/api/**` or
    `src/middleware.ts` requires the code owners listed in `.github/CODEOWNERS`.
  - Schema/migration changes require a database-impact note in the PR description.
- **Rate limits & quotas** (apply when an agent triggers downstream services):
  - Auth: identity/IP rate limit + Turnstile.
  - PDF: per-route rate limit plus `PDF_GENERATION` feature flag.
  - Webhooks: must be replay-safe; verify signatures and idempotency keys before any DB write.
- **Out of scope for automation**: editing the LICENSE, granting or revoking admin roles, pushing database
  schema changes to a shared environment, and changing production secrets.

# Extensibility Hooks

- **Feature flags**: `FeatureFlag` rows (`MAINTENANCE_MODE`, `PDF_GENERATION`, `REGISTRATION`) toggled from
  `/admin/settings`; consumed by `src/server/system/` and `src/middleware.ts`.
- **Plan tiers**: `FREE` and `PREMIUM` are computed from active `Subscription` rows in
  `src/server/billing/`. Pricing ids/plan references: `STRIPE_PREMIUM_PRICE_ID`,
  `IYZICO_PREMIUM_PLAN_REFERENCE_CODE`.
- **Templates**: register a new résumé template by adding a renderer pair under
  `src/templates/dom/<key>` and `src/templates/pdf/<key>`, then wire it into the shared registry used by
  the editor and PDF pipeline.
- **Payments**: provider adapters live in `src/server/payments/`; a new provider must implement signature
  verification, idempotent event handling and Prisma-transactional subscription updates.
- **Auth providers**: add a new provider under `src/server/auth/`; guard OAuth behavior with explicit env
  checks (mirroring the Google provider).
- **Rate limiting**: swap the in-memory fallback by configuring `VALKEY_URL`; clients implement the
  interface used by `src/server/security/`.
- **Uploads**: extend `src/server/uploadthing.ts` with additional file routes, mirroring the existing
  ownership and size checks (`profileImage`, `resumeAsset`).
- **Environment**: every new flag must be declared in `src/env.js` with the correct client/server split and
  listed in `.env.example`.

# Further Reading

- [`README.md`](./README.md) – Full product, command and routing reference (Turkish).
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) – Branch, commit, validation and PR expectations.
- [`SECURITY.md`](./SECURITY.md) – Private vulnerability disclosure process.
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) – Community behavior expectations.
- [`SUPPORT.md`](./SUPPORT.md) – Support channels.
- [`CHANGELOG.md`](./CHANGELOG.md) – Release notes.
- [`LICENSE`](./LICENSE) – Source-available license terms (Version 1.0, 13 July 2026).
- [`Errors.md`](./Errors.md) – Known operational issues and workarounds.
- [`prisma/schema.prisma`](./prisma/schema.prisma) and [`prisma/schema.postgresql.prisma`](./prisma/schema.postgresql.prisma) – Database schemas.
- [`scripts/generate-prisma.mjs`](./scripts/generate-prisma.mjs) – Provider-aware Prisma client generator.
- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) – CI pipeline definition.
- `.github/CODEOWNERS` – Required reviewers per area.

> TODO: Add `docs/ARCH.md` and ADR documents under a `docs/` directory as deeper architectural decisions are
> captured; link them from this section when they exist.
