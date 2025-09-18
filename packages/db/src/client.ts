import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionConfig = {
  prepare: false,
  max: 2,
  idle_timeout: 90,
  max_lifetime: 0,
  connect_timeout: 10,
}

const primaryPool = postgres(process.env.POSTGRES_URL!, connectionConfig)

export const primaryDb = drizzle(primaryPool, {
  schema,
  casing: 'snake_case',
})
