import { sql } from 'drizzle-orm'
import { date } from 'drizzle-orm/pg-core'
import { pgEnum } from 'drizzle-orm/pg-core'
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
  uniqueIndex,
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

export const transferStatusEnum = pgEnum('transfer_status', ['Entered', 'Committed', 'Withdrawn'])

export const positions = pgTable(
  'positions',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    abbreviation: varchar('abbreviation', { length: 10 }).notNull(),
  },
  (table) => [
    uniqueIndex('name_idx').on(table.name),
    uniqueIndex('abbreviation_idx').on(table.abbreviation),
  ],
)

export const classYears = pgTable(
  'class_years',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    abbreviation: varchar('abbreviation', { length: 10 }).notNull(),
  },
  (table) => [
    uniqueIndex('class_year_name_idx').on(table.name),
    uniqueIndex('class_year_abbreviation_idx').on(table.abbreviation),
  ],
)

export const schoolReferences = pgTable(
  'school_references',
  {
    id: serial('id').primaryKey(),
    sanityId: text('sanity_id').notNull().unique(),
    name: text('name').notNull(),
  },
  (table) => [
    uniqueIndex('sanity_id_idx').on(table.sanityId),
    uniqueIndex('school_name_idx').on(table.name),
  ],
)

export const players = pgTable(
  'players',
  {
    id: serial('id').primaryKey(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    height: integer('height'), // in inches
    weight: integer('weight'), // in pounds
    highSchool: text('high_school'),
    hometown: text('hometown'),
    state: varchar('state', { length: 2 }),
    playerImageUrl: text('player_image_url'),
    instagramHandle: varchar('instagram_handle', { length: 30 }),
    twitterHandle: varchar('twitter_handle', { length: 30 }),
    positionId: integer('position_id').references(() => positions.id),
    currentSchoolId: integer('current_school_id').references(() => schoolReferences.id),
    classYearId: integer('class_year_id').references(() => classYears.id),
  },
  (table) => [
    uniqueIndex('players_name_idx').on(table.lastName, table.firstName),
    uniqueIndex('players_social_media_idx').on(table.instagramHandle, table.twitterHandle),
  ],
)

export const cycleYears = pgTable('cycle_years', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const transferPortalEntries = pgTable(
  'transfer_portal_entries',
  {
    id: serial('id').primaryKey(),
    playerId: integer('player_id')
      .references(() => players.id)
      .notNull(),
    entryDate: date('entry_date').notNull(),
    cycleYearId: integer('cycle_year_id')
      .references(() => cycleYears.id)
      .notNull(),
    transferStatus: transferStatusEnum('transfer_status').notNull().default('Entered'),
    isGradTransfer: boolean('is_grad_transfer').notNull().default(false),
    previousSchoolId: integer('previous_school_id')
      .references(() => schoolReferences.id)
      .notNull(),
    commitmentSchoolId: integer('commitment_school_id').references(() => schoolReferences.id),
    commitmentDate: date('commitment_date'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    lastStatusChangeAt: timestamp('last_status_change_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('unique_player_entry').on(table.playerId, table.entryDate),
    uniqueIndex('transfer_portal_entries_date_idx').on(table.entryDate),
  ],
)
