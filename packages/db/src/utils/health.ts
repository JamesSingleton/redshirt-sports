import { sql } from "drizzle-orm";

import { ensurePrimaryDbAlive, primaryDb } from "../client";

export async function checkHealth() {
  await ensurePrimaryDbAlive();
  await primaryDb.execute(sql`SELECT 1`);
}
