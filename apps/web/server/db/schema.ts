import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  unique,
  jsonb,
  text,
  boolean,
} from 'drizzle-orm/pg-core'

export const voterBallots = pgTable('voter_ballot', {
  id: serial('id').primaryKey(),
  userId: varchar('userId', { length: 256 }).notNull(),
  division: varchar('division', { length: 10 }).notNull(),
  week: integer('week').notNull(),
  year: integer('year')
    .default(sql`EXTRACT(year FROM CURRENT_DATE)`)
    .notNull(),
  createdAt: timestamp('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  teamId: varchar('team_id', { length: 256 }).notNull(),
  rank: integer('rank').notNull(),
  points: integer('points').notNull(),
})

export const weeklyFinalRankings = pgTable(
  'weekly_final_rankings',
  {
    id: serial('id').primaryKey(),
    division: varchar('division', { length: 10 }).notNull(),
    week: integer('week').notNull(),
    year: integer('year').notNull(),
    rankings: jsonb('rankings').notNull(),
  },
  (table) => ({
    isUniqueVote: unique().on(table.division, table.year, table.week),
  }),
)

export const usersTable = pgTable('users_table', {
  id: text('id').primaryKey(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  organization: text('organization'),
  organizationRole: text('organizationRole'),
  isAdmin: boolean('isAdmin').default(false).notNull(),
  isVoter: boolean('isVoter').default(false).notNull(),
})

export const seasonsTable = pgTable(
  'seasons',
  {
    id: serial('id').primaryKey(),
    year: integer('year').notNull(),
    start: timestamp('start').notNull(),
    end: timestamp('end').notNull(),
  },
  (table) => ({
    isUniqueSeason: unique().on(table.year),
  }),
)

export const weeksTable = pgTable(
  'weeks',
  {
    id: serial('id').primaryKey(),
    seasonId: integer('seasonId')
      .notNull()
      .references(() => seasonsTable.id),
    week: integer('week').notNull(),
    start: timestamp('start').notNull(),
    end: timestamp('end').notNull(),
  },
  (table) => ({
    isUniqueWeek: unique().on(table.seasonId, table.week),
  }),
)

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect
