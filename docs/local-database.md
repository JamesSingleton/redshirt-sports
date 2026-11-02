# Local database from production

`pnpm db:sync-from-prod` rebuilds your local Postgres as a copy of production, so local work runs against real sports, schools, conferences, seasons, weeks, polls, and ballots instead of fixtures.

## Setup

1. Start the local stack: `supabase start` in `apps/web`.
2. Set `PROD_DATABASE_URL` in `apps/web/.env.local` to production's **session pooler or direct** connection string (port 5432). The transaction pooler (6543) can't run `pg_dump`.
3. Have `pg_dump` and `pg_restore` on your PATH, at the same major version as production or newer (`brew install postgresql@18`).

## Run

```bash
pnpm db:sync-from-prod
```

It asks before it wipes anything. What it does:

1. **Reads production, read-only.** Every session is opened with `default_transaction_read_only=on`. It finds production's migration level, then takes a data-only dump of the `public` schema into `apps/web/supabase/seed/prod-YYYYMMDD.dump` (gitignored).
2. **Resets local.** It drops the local `public` and `drizzle` schemas and runs this repo's migrations **up to production's level**, so the dump restores into the exact shape it came from. It refuses any `DATABASE_URL` that isn't on this machine.
3. **Restores the data.** Foreign keys are lifted during the load and added back afterwards, which re-validates every row.
4. **Checks itself.** Row counts are compared table by table against production, and any difference fails the run.

Then apply any migrations your branch adds on top:

```bash
pnpm --filter web db:migrate
```

This doubles as a rehearsal of the production migration against real data.

## How production is migrated

Production is migrated with the Supabase CLI. Its `supabase_migrations.schema_migrations` table lists 0000 through the latest migration, and this script reads that table to find production's level.

Production also has a `drizzle.__drizzle_migrations` table, but it's left over from an older migration history and doesn't match this repo's journal. **Never run `drizzle-kit migrate` (`pnpm db:migrate`) against production**: it would try to re-apply migrations. Locally, either tool is fine, and this script copies production's Supabase tracker so `supabase migration list --local` matches.

## Options

| Flag                                           | Effect                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `--yes`                                        | Skip the confirmation prompt.                                                                                                              |
| `--scrub-users`                                | Anonymize users who are neither voters nor admins. Voter names are already public on the ballots pages.                                    |
| `--as-voter <prodUserId>=<clerkDevUserId>`     | Re-key one production user, and everything that references them, to your Clerk development user, so you can sign in locally as that voter. |
| `--dump-only`                                  | Write the dump and stop.                                                                                                                   |
| `--from-dump <file> --through <migration tag>` | Restore an existing dump without touching production.                                                                                      |
| `--source <url>` / `--target <url>`            | Override `PROD_DATABASE_URL` / `DATABASE_URL`.                                                                                             |

Without production access, `pnpm --filter @redshirt-sports/db db:seed:users-with-ballots` still seeds fixture voters and ballots.
