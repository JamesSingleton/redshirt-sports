import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads apps/web/.env.local into process.env (without overriding the shell),
 * then refuses drizzle-kit migrate/push unless that env is local-only.
 * Import this before `@/env` so DATABASE_URL is set before validation.
 */
const envPath = resolve(process.cwd(), ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

const isMigrateOrPush = process.argv.some((arg) => /migrate|push/.test(arg));
if (isMigrateOrPush && process.env.CI !== "true") {
  execFileSync(
    process.execPath,
    [resolve(process.cwd(), "../../scripts/assert-local-env.mjs"), envPath],
    { stdio: "inherit" },
  );
}
