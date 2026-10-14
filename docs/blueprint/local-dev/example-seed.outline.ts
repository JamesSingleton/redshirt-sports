// OUTLINE for packages/db/seeds/example-data.ts (exposed as `db:seed:example` in packages/db/package.json).
// Write the real version in Milestone 0 against the actual exports of packages/db/src/schema.ts.
// Rules: LOCAL ONLY (guarded), idempotent, clearly fake names, no real voters or users.
import "dotenv/config";
import { execFileSync } from "node:child_process";

// 1. Guard: refuse anything but local Supabase (127.0.0.1:54322).
execFileSync("node", ["../../scripts/assert-local-env.mjs", "../../apps/web/.env.local"], { stdio: "inherit" });

// 2. Connect with drizzle-orm/postgres-js using process.env.DATABASE_URL (local).
// const db = drizzle(postgres(process.env.DATABASE_URL!, { max: 1 }));

// 3. Upsert (ON CONFLICT DO NOTHING / onConflictDoUpdate) in dependency order:
//    sports → classifications / browse scopes → polls (football/fcs, mens-basketball/mid-major)
//    → seasons + weeks (2026 preseason … week 7) → schools ("Example State", "Sample Tech", … 30 rows,
//    sanity ids "fixture.school.*") → users ("Example Voter 1…12", clerk ids "user_fixture_*")
//    → poll_voters → ballots + ballot_entries for week 7 (deterministic shuffle, seed 42)
//    → poll_rankings for week 6 (published) so the rankings page has data.
// 4. Print a summary of row counts. Never print secrets.
