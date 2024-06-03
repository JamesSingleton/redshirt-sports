import { sql } from 'drizzle-orm'
import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core'

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  userId: varchar('userId', { length: 256 }).notNull(),
  teamId: varchar('teamId', { length: 256 }).notNull(),
  rank: integer('rank').notNull(),
  week: integer('week').notNull(),
  year: integer('year')
    .default(sql`EXTRACT(year FROM CURRENT_DATE)`)
    .notNull(),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updatedAt'),
})
