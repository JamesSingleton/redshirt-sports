import * as schema from "@redshirt-sports/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

/**
 * Keep in sync with `@redshirt-sports/db` serverlessPostgresOptions.
 * Short connect/idle timeouts avoid Vercel function hangs on stale sockets.
 */
const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 2,
  idle_timeout: 20,
  max_lifetime: 60 * 5,
  connect_timeout: 3,
});

// Use this object to send drizzle queries to your DB
export const db = drizzle(client, { schema });
