# @redshirt-sports/web

Public Next.js site for Redshirt Sports.

## Local database (Supabase + Drizzle)

**Do not point local development at production Postgres.** Vote, cron, webhooks, and `db:push` / `db:migrate` can write data. Use local Supabase instead.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or another Docker runtime)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)

### One-time setup

1. Copy env and fill Sanity / Clerk / etc. as usual:

```bash
cp .env.example .env.local
```

2. Start local Supabase (from this directory):

```bash
pnpm db:local:start
```

3. Copy the **DB URL** from `pnpm db:local:status` into `.env.local` as `DATABASE_URL`.  
   Default local connection:

```text
postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

4. Reset the local DB (applies all migrations in `supabase/migrations` + `supabase/seed.sql`):

```bash
pnpm db:local:reset
```

5. Run the app:

```bash
pnpm dev
```

Useful URLs after `db:local:start`:

| Service        | URL                        |
| -------------- | -------------------------- |
| Postgres       | `127.0.0.1:54322`          |
| Supabase Studio| http://127.0.0.1:54323     |
| API            | http://127.0.0.1:54321     |

### Schema changes

1. Edit `packages/db/src/schema.ts`
2. Generate a migration: `pnpm db:generate`
3. Apply locally: `pnpm db:local:reset` (or `pnpm db:migrate` against local only)

`db:migrate` and `db:push` refuse non-localhost hosts unless you set `ALLOW_REMOTE_DB=1`.

### Notes

- **Sanity** stays on your cloud project/dataset — only app data (ballots, rankings, players) lives in Postgres.
- **Clerk** stays cloud for local auth; just ensure `DATABASE_URL` is local so votes/webhooks do not hit prod.
- Seed data is minimal smoke-test data, not a production dump.
- **Never point local apps at production Postgres** for day-to-day work (votes, finalize, admin CRUD). Use local Supabase. Production finalize belongs in the admin app once shipped; the old local→prod API hack is emergency-only.
- Optional portal fixtures: `pnpm --filter @redshirt-sports/web exec tsx ../../packages/db/scripts/seed-players-portal.ts`
- Set `CRON_SECRET` in `.env.local` if you call the rankings cron fallback locally.

### Phase 0 local validation checklist

1. `pnpm db:local:start` → `pnpm db:local:reset`
2. Migrate new schema (assignments, rankings indexes) via `db:generate` + `db:local:reset` or `db:migrate`
3. Seed voters with different poll scopes; confirm vote API returns `403` for the wrong division
4. Submit ballots; run admin preview/finalize against local DB
5. CRUD players/portal in admin; confirm public feed/profile pages
6. Prod migrate only with `ALLOW_REMOTE_DB=1` after local sign-off
