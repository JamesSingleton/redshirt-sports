import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ballots } from './schema'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)
const db = drizzle(client)

export const allBallots = await db.select().from(ballots)