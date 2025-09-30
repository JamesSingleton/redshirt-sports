import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from '@redshirt-sports/db/schema'
import { env } from '@/app/env'

const connectionString = env.POSTGRES_URL
const client = postgres(connectionString, { prepare: false })

// Use this object to send drizzle queries to your DB
export const db = drizzle(client, { schema })
