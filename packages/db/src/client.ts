import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { keys } from "../keys";
import * as schema from "./schema";

/**
 * Transaction-pooler safe options (Supabase port 6543).
 * `prepare: false` is required — named prepared statements aren't supported
 * in transaction mode.
 * @see https://supabase.com/docs/guides/database/drizzle
 */
const client = postgres(keys().DATABASE_URL, {
  prepare: false,
  max: 2,
  idle_timeout: 20,
  max_lifetime: 0,
  connect_timeout: 10,
});

export const primaryDb = drizzle(client, {
  schema,
  casing: "snake_case",
});
