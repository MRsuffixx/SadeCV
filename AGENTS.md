# SadeCV contributor guide

SadeCV is a single Next.js App Router application. Keep authentication,
entitlement, payment, upload, and administrator authorization checks on the
server even when the UI already hides an action.

## Local workflow

- Install with `pnpm install`.
- Run the app with `pnpm dev`.
- Validate changes with `pnpm check`, `pnpm format:check`, and `pnpm build`.
- Use the `db:*` package scripts instead of invoking Prisma directly; the
  wrapper selects the configured schema and handles locked Windows engines.

## Data and security conventions

- Never trust payment callback query parameters. Correlate provider tokens to
  a server-created `PaymentCheckout` record and verify webhook signatures.
- Keep ledger identity fields immutable during webhook retries.
- Use `protectedProcedure` or `protectedAdminProcedure` for private tRPC APIs.
- Validate remote asset hosts before server-side PDF rendering.
- Store one-time secrets only as hashes and make state transitions atomic.
- Preserve unrelated worktree changes and add a focused regression test when
  changing an authentication, quota, or payment invariant.
