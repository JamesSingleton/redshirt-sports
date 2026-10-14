# Local development (local-only by rule)

Cursor and any other coding agent work **only against a local stack**. This page is the reference for `.cursor/rules/01-local-only.mdc` and the "Local only" section of `AGENTS.md`.

## The stack

| Service | Local setup | Address |
|---|---|---|
| Postgres (app data) | Local Supabase via `supabase start --workdir apps/web` (Docker), using `apps/web/supabase/config.toml` | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase API / Studio / mail | Same stack | API `:54321`, Studio `http://127.0.0.1:54323`, Inbucket `http://127.0.0.1:54324` |
| Sanity (content) | Studio runs locally against the **`development`** dataset (or fixtures in `docs/blueprint/local-dev/`) | Studio `http://localhost:3333` |
| Clerk (auth) | **Development instance** keys only (`pk_test_…`, `sk_test_…`). Webhooks come in through a tunnel to `http://localhost:3000/api/webhooks/auth` | n/a |
| Email | `EMAIL_TRANSPORT=preview` (React Email render to `.local-email/` plus the `email dev` preview), or Resend **test mode** sending only to `delivered@resend.dev` | n/a |
| Redis (rate limits) | Local Redis behind `serverless-redis-http` (Upstash-compatible), see below | `http://127.0.0.1:8079` |
| Apps | `pnpm dev` | web `:3000`, admin `:3001`, vote `:3002`, studio `:3333` |

## One-time setup: `pnpm dev:setup`

The root `package.json` already has:

```jsonc
"scripts": {
  "dev:setup": "bash scripts/dev-setup.sh",
  "env:check": "node scripts/assert-local-env.mjs"
}
```

`scripts/dev-setup.sh` is an outline: review it before the first run. It does the following:
1. Checks Node ≥ 22.12, pnpm and Docker.
2. Runs `pnpm install`.
3. Copies `apps/{web,admin,studio}/.env.local.example` to `.env.local`. Existing `.env.local` files are never overwritten.
4. Runs `supabase start --workdir apps/web` and prints `supabase status` (paste the **local** keys it shows into `apps/web/.env.local`).
5. Runs `node scripts/assert-local-env.mjs`, which stops the script if anything points at a non-local DB, a `production` Sanity dataset, live Clerk keys, `PROD_DATABASE_URL`, or a pulled Vercel env.
6. Runs `supabase db reset --local` (migrations + `seed.sql`), then `pnpm --filter @redshirt-sports/web db:migrate` and the example seeds (`db:seed:example`; outline in `local-dev/example-seed.outline.ts`).
7. Optional, only with `DEV_SETUP_IMPORT_SANITY=1`: imports `local-dev/sanity-fixtures.example.ndjson` into the **development** dataset. It refuses if the dataset is `production`.
8. Prints the local URLs. Then run `pnpm dev`.

### Local Redis for `@upstash/ratelimit`

```bash
docker network create rs-local 2>/dev/null || true
docker run -d --name rs-redis --network rs-local -p 6379:6379 redis:7
docker run -d --name rs-srh --network rs-local -p 8079:80 \
  -e SRH_MODE=env -e SRH_TOKEN=local_srh_token -e SRH_CONNECTION_STRING=redis://rs-redis:6379 \
  hiett/serverless-redis-http:latest
```

## Guard the DB commands (Milestone 0 change)

`apps/web/drizzle.config.ts` reads `env.DATABASE_URL`. Make migrate/push refuse non-local URLs by adding this at the top of the config, or by chaining the scripts:

```ts
// apps/web/drizzle.config.ts (top)
import { execFileSync } from "node:child_process";
if (process.argv.some((a) => /migrate|push/.test(a)) && process.env.CI !== "true") {
  execFileSync("node", ["../../scripts/assert-local-env.mjs", ".env.local"], { stdio: "inherit" });
}
```

```jsonc
// apps/web/package.json (alternative)
"db:migrate": "node ../../scripts/assert-local-env.mjs .env.local && drizzle-kit migrate",
"db:push": "node ../../scripts/assert-local-env.mjs .env.local && drizzle-kit push"
```

Production migrations stay a CI job with manual approval (blueprint §7.2), and only that job holds production DB credentials.

## Allowed vs. never

| Allowed (local) | Never (remote/production) |
|---|---|
| `supabase start/stop/status`, `supabase db reset --local`, `supabase migration new` | `supabase link`, `supabase db push`, `supabase db reset --linked`, any SQL on a remote project |
| `drizzle-kit generate`; `drizzle-kit migrate/push` with a local `DATABASE_URL` | `drizzle-kit migrate/push` with any non-local URL; `PROD_DATABASE_URL`; `pnpm db:dump-prod` |
| Sanity Studio `dev`, `type` (schema extract + typegen), GROQ reads on `development` | `sanity deploy`, `sanity schema deploy`, `sanity blueprints deploy`, Studio `build`/`deploy`/`deploy:schema`, writes to `production` |
| Clerk dev instance; test users like `example+clerk_test@…` | Live keys (`pk_live_`/`sk_live_`), changing production instance config |
| `EMAIL_TRANSPORT=preview`; Resend test recipients | Sending to real addresses, production audiences or broadcasts |
| MCP docs/search tools (read-only docs) | MCP tools that run SQL, migrations, deploys, env or content writes on Supabase, Neon, Vercel, Sanity or Clerk |
| `pnpm build` of web/admin locally | `vercel`, `vercel deploy`, `vercel --prod`, `vercel env pull`, triggering deploy/migrate workflows |

## Seed data

- **Postgres:** `apps/web/supabase/seed.sql` (existing), `packages/db/seeds/users-with-ballots.ts` (existing; check that it's fake data and local-only before using it), and the new `db:seed:example` (fake schools, voters, ballots, published week).
- **Sanity:** the `development` dataset, plus `local-dev/sanity-fixtures.example.ndjson` (fake schools and three fake `portalEntry` docs with no story linked, since `story` is optional pending Open Decision #16). Adapt the fields to the existing `school` schema before importing.
- **Never** copy production rows or real voter identities into fixtures.

## Milestone 0 check: the local stack runs
See `BUILD_ORDER.md` → Milestone 0, "Verify the local stack".
