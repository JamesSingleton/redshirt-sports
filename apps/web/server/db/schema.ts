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
import { randomUUID } from 'node:crypto'

export const sportsTable = pgTable('sports', {
  id: text('id').primaryKey(), // Sanity _id
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  displayName: varchar('display_name', { length: 256 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const voterBallots = pgTable(
  'voter_ballot',
  {
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
    sportId: varchar('sport_id', { length: 256 }).references(() => sportsTable.id),
  },
  (table) => [
    unique().on(table.userId, table.division, table.week, table.year, table.sportId, table.teamId),
  ],
)

export const weeklyFinalRankings = pgTable(
  'weekly_final_rankings',
  {
    id: serial('id').primaryKey(),
    division: varchar('division', { length: 10 }).notNull(),
    sportId: varchar('sport_id', { length: 256 }).references(() => sportsTable.id),
    week: integer('week').notNull(),
    year: integer('year').notNull(),
    rankings: jsonb('rankings').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.division, table.year, table.week)],
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
    id: text('id')
      .primaryKey()
      .$default(() => randomUUID()),
    year: integer('year').notNull(),
    displayName: varchar('display_name', { length: 256 }),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    sportId: text('sport_id')
      .notNull()
      .references(() => sportsTable.id),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.sportId, table.year)],
)

export const seasonTypesTable = pgTable(
  'season_types',
  {
    id: text('id')
      .primaryKey()
      .$default(() => randomUUID()),
    type: integer('type').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasonsTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.seasonId, table.type)],
)

export const weeksTable = pgTable(
  'weeks',
  {
    id: text('id')
      .primaryKey()
      .$default(() => randomUUID()),
    number: integer('number').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    text: varchar('text', { length: 256 }),
    seasonTypeId: text('season_type_id')
      .notNull()
      .references(() => seasonTypesTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.seasonTypeId, table.number)],
)

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect
export type InsertSeason = typeof seasonsTable.$inferInsert
export type InsertSeasonType = typeof seasonTypesTable.$inferInsert
export type InsertWeeks = typeof weeksTable.$inferInsert

export const SEASON_TYPE_CODES = {
  PRESEASON: 1,
  REGULAR_SEASON: 2,
  POSTSEASON: 3,
  OFF_SEASON: 4,
} as const
