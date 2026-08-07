import * as schema from "@redshirt-sports/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

/** Keep in sync with `@redshirt-sports/db` client options. */
const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 2,
  idle_timeout: 20,
  max_lifetime: 0,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
