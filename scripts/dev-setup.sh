#!/usr/bin/env bash
# pnpm dev:setup: one-command LOCAL stack setup (outline; review before first run).
# Never touches remote Supabase/Neon/Vercel/Sanity production. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."

say() { printf "\n\033[1m▸ %s\033[0m\n" "$*"; }

say "1/8 Prerequisites"
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if (a<22||(a===22&&b<12)) {console.error("Node >= 22.12 required"); process.exit(1)}'
command -v pnpm >/dev/null || { echo "pnpm missing (corepack enable)"; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker is not running (needed for local Supabase)"; exit 1; }
SUPABASE="pnpm dlx supabase@latest"   # or a globally installed `supabase`; pin a version once verified

say "2/8 Install"
pnpm install

say "3/8 Env files (local values only; existing .env.local files are kept)"
for app in web admin studio; do
  if [ -f "apps/$app/.env.local.example" ] && [ ! -f "apps/$app/.env.local" ]; then
    cp "apps/$app/.env.local.example" "apps/$app/.env.local"; echo "created apps/$app/.env.local"
  fi
done

say "4/8 Start local Supabase (Docker): Postgres :54322, Studio :54323, Inbucket :54324"
$SUPABASE start --workdir apps/web
$SUPABASE status --workdir apps/web || true
echo "Copy the local anon/service keys printed above into apps/web/.env.local if they differ from the defaults."

say "5/8 Guard: refuse anything non-local"
node scripts/assert-local-env.mjs

say "6/8 Schema + seed (LOCAL ONLY)"
# Fresh local DB: applies apps/web/supabase/migrations + seed.sql. --local is explicit on purpose.
$SUPABASE db reset --local --workdir apps/web
# Drizzle migrations (no-op if supabase already applied them; keeps drizzle's journal in sync).
pnpm --filter @redshirt-sports/web db:migrate
# Example data (fake schools/voters/ballots). Add db:seed:example in Milestone 0.
pnpm --filter @redshirt-sports/db db:seed:users-with-ballots || echo "(skip: seed needs review for local)"
pnpm --filter @redshirt-sports/db run --if-present db:seed:example

say "7/8 Sanity: development dataset only"
# Writes to the Sanity *development* dataset only, and only when asked: DEV_SETUP_IMPORT_SANITY=1.
if [ "${DEV_SETUP_IMPORT_SANITY:-0}" = "1" ]; then
  DATASET="$(grep -E '^SANITY_STUDIO_DATASET=' apps/studio/.env.local | cut -d= -f2 | tr -d '"')"
  [ "$DATASET" = "production" ] && { echo "Refusing: dataset is production"; exit 1; }
  pnpm --filter @redshirt-sports/studio exec sanity dataset import ../../docs/blueprint/local-dev/sanity-fixtures.example.ndjson "$DATASET" --missing
else
  echo "Skipped (set DEV_SETUP_IMPORT_SANITY=1 to import fixtures into the development dataset)."
fi

say "8/8 Done. Next: pnpm dev"
cat <<TXT
  web     http://localhost:3000
  admin   http://localhost:3001
  studio  http://localhost:3333
  db      postgresql://postgres:postgres@127.0.0.1:54322/postgres  (Studio http://127.0.0.1:54323)
  email   React Email preview / .local-email/  (Supabase Inbucket http://127.0.0.1:54324)
TXT
