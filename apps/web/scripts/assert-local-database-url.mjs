#!/usr/bin/env node
/**
 * Prevents drizzle migrate/push from running against a remote database
 * unless ALLOW_REMOTE_DB=1 is explicitly set.
 */

const url = process.env.DATABASE_URL;

if (!url) {
  console.error(
    "[db] DATABASE_URL is not set. Start local Supabase and copy the local connection string into apps/web/.env.local.",
  );
  process.exit(1);
}

let hostname;
try {
  hostname = new URL(url).hostname;
} catch {
  console.error("[db] DATABASE_URL is not a valid URL.");
  process.exit(1);
}

const isLocal =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname === "0.0.0.0" ||
  hostname.endsWith(".local");

if (!isLocal && process.env.ALLOW_REMOTE_DB !== "1") {
  console.error(
    `[db] Refusing to run against non-local host "${hostname}".\n` +
      "Point DATABASE_URL at local Supabase (127.0.0.1:54322), or set ALLOW_REMOTE_DB=1 for intentional remote ops.",
  );
  process.exit(1);
}
