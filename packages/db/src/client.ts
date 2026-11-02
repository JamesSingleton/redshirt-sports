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
  // Supavisor allows 200 client connections in total, and a paused Vercel
  // instance keeps its idle connections open (its idle timer can't fire) until
  // the instance is shut down. A burst of re-renders at 5 per instance filled
  // all 200 on 2026-11-02. 3 per instance roughly halves a burst and still
  // leaves a connection free beside a poll/week lock holder and its waiter.
  max: 3,
  // Release idle connections quickly while the instance is still running.
  idle_timeout: 10,
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
