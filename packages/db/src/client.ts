import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { keys } from "../keys";
import * as schema from "./schema";

/**
 * Transaction-pooler safe options (Supabase port 6543).
 * `prepare: false` is required — named prepared statements aren't supported
 * in transaction mode.
 * `fetch_types: false` skips the per-connection `pg_catalog.pg_type` probe
 * (large shared-pooler egress on serverless reconnects). Safe with Drizzle's
 * text/int/bool/timestamptz/jsonb usage.
 * @see https://supabase.com/docs/guides/database/drizzle
 * @see https://github.com/porsager/postgres#auto-fetching-of-array-types
 */
const client = postgres(keys().DATABASE_URL, {
  prepare: false,
  fetch_types: false,
  max: 5,
  // Longer idle keeps warm serverless isolates from reconnecting (and
  // re-authing through Supavisor) on every quiet stretch.
  idle_timeout: 60,
  max_lifetime: 0,
  // Default is 30s; keep tighter so hung pooler connects fail fast on serverless.
  connect_timeout: 10,
  connection: {
    application_name: "redshirt-db",
    // Postgres GUCs in milliseconds — abort hung statements and idle-in-tx sessions.
    statement_timeout: 30_000,
    idle_in_transaction_session_timeout: 30_000,
  },
});

export const primaryDb = drizzle(client, {
  schema,
  casing: "snake_case",
});

/**
 * Trusted connection. The local `postgres` role bypasses RLS.
 * Authorize in application code before using this.
 * A dedicated `rs_server` login is left for a later environment that can
 * store a role password. Local Postgres already bypasses RLS.
 */
export const adminDb = primaryDb;

type DbTransaction = Parameters<Parameters<typeof adminDb.transaction>[0]>[0];

/**
 * Run `fn` as `authenticated` or `anon` so RLS applies inside this transaction.
 * The role is one of two literals. It is never taken from user input.
 */
export async function withRls<T>(
  claims: { sub: string; roles?: string[] } | null,
  fn: (tx: DbTransaction) => Promise<T>,
): Promise<T> {
  const role = claims ? "authenticated" : "anon";
  const jwt = JSON.stringify(claims ? { ...claims, role } : { role });
  return adminDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('request.jwt.claims', ${jwt}, true)`,
    );
    await tx.execute(sql.raw(`set local role ${role}`));
    return fn(tx);
  });
}
