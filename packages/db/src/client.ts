import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { keys } from "../keys";
import * as schema from "./schema";

/**
 * Transaction-pooler safe options (Supabase port 6543).
 * `prepare: false` is required — named prepared statements aren't supported
 * in transaction mode.
 *
 * Use `DATABASE_URL` (pooler) for request-path queries.
 * Use `DATABASE_DIRECT_URL` (session / port 5432) for drizzle-kit migrations
 * and long-running jobs — see `drizzle.config.ts`.
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
