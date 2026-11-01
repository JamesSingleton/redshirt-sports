import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import {
  INTEGRATION_DATABASE_NAME,
  integrationDatabaseUrl,
  maintenanceDatabaseUrl,
} from "./database-url";

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/supabase/migrations",
);

/** Create the test database if needed and bring it to the latest migration. */
export default async function setup() {
  const url = integrationDatabaseUrl();
  // Workers start after global setup and inherit this, so the app client
  // in src/client.ts connects to the test database.
  process.env.DATABASE_URL = url;

  const admin = postgres(maintenanceDatabaseUrl(url), {
    max: 1,
    onnotice: () => {},
  });
  try {
    const existing =
      await admin`select 1 from pg_database where datname = ${INTEGRATION_DATABASE_NAME}`;
    if (existing.length === 0) {
      await admin.unsafe(`create database ${INTEGRATION_DATABASE_NAME}`);
    }
  } finally {
    await admin.end();
  }

  const client = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end();
  }
}
