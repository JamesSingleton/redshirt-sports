import { sql } from "drizzle-orm";

import { primaryDb } from "../client";

export async function checkHealth() {
  await primaryDb.execute(sql`SELECT 1`);
}
