import { sql } from 'drizzle-orm'
import { pgTable, serial, varchar, timestamp, integer, unique } from 'drizzle-orm/pg-core'

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

export const ballots = pgTable(
  'ballots',
  {
    id: serial('id').primaryKey(),
    userId: varchar('userId', { length: 256 }).notNull(),
    week: integer('week').notNull(),
    year: integer('year')
      .default(sql`EXTRACT(year FROM CURRENT_DATE)`)
      .notNull(),
    createdAt: timestamp('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updatedAt'),
    rank_1: varchar('rank_1', { length: 256 }).notNull(),
    rank_2: varchar('rank_2', { length: 256 }).notNull(),
    rank_3: varchar('rank_3', { length: 256 }).notNull(),
    rank_4: varchar('rank_4', { length: 256 }).notNull(),
    rank_5: varchar('rank_5', { length: 256 }).notNull(),
    rank_6: varchar('rank_6', { length: 256 }).notNull(),
    rank_7: varchar('rank_7', { length: 256 }).notNull(),
    rank_8: varchar('rank_8', { length: 256 }).notNull(),
    rank_9: varchar('rank_9', { length: 256 }).notNull(),
    rank_10: varchar('rank_10', { length: 256 }).notNull(),
    rank_11: varchar('rank_11', { length: 256 }).notNull(),
    rank_12: varchar('rank_12', { length: 256 }).notNull(),
    rank_13: varchar('rank_13', { length: 256 }).notNull(),
    rank_14: varchar('rank_14', { length: 256 }).notNull(),
    rank_15: varchar('rank_15', { length: 256 }).notNull(),
    rank_16: varchar('rank_16', { length: 256 }).notNull(),
    rank_17: varchar('rank_17', { length: 256 }).notNull(),
    rank_18: varchar('rank_18', { length: 256 }).notNull(),
    rank_19: varchar('rank_19', { length: 256 }).notNull(),
    rank_20: varchar('rank_20', { length: 256 }).notNull(),
    rank_21: varchar('rank_21', { length: 256 }).notNull(),
    rank_22: varchar('rank_22', { length: 256 }).notNull(),
    rank_23: varchar('rank_23', { length: 256 }).notNull(),
    rank_24: varchar('rank_24', { length: 256 }).notNull(),
    rank_25: varchar('rank_25', { length: 256 }).notNull(),
  },
  (table) => ({
    isUniqueVote: unique().on(table.userId, table.year, table.week),
  }),
)
