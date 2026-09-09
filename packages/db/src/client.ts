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
  },
});

export const primaryDb = drizzle(client, {
  schema,
  casing: "snake_case",
});
