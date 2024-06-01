import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ballots } from './schema'

const connectionString = process.env.POSTGRES_URL_NON_POOLING!

const client = postgres(connectionString)
const db = drizzle(client)

export const allBallots = await db.select().from(ballots)