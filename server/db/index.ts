import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'
import { env } from '@/app/env'

const client = postgres(env.POSTGRES_URL)

// Use this object to send drizzle queries to your DB
export const db = drizzle(client, { schema })
