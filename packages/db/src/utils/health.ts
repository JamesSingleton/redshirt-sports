import { primaryDb } from '@db/client'
import { sql } from 'drizzle-orm'

export async function checkHealth() {
  await primaryDb.execute(sql`SELECT 1`)
}
