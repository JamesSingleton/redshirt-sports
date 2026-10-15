import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../../..");
const envFile = resolve(repoRoot, "apps/web/.env.local");

execFileSync(
  process.execPath,
  [resolve(repoRoot, "scripts/assert-local-env.mjs"), envFile],
  { stdio: "inherit" },
);

console.log(
  "Local check passed. Apply apps/web/supabase/seed.sql with `supabase db reset --local`. This script does not open a database connection.",
);
