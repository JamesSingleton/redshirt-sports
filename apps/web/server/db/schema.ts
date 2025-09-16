import { sql, relations } from 'drizzle-orm'
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

const timestamps = {
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
}

const defaultColumns = {
  id: text('id')
    .primaryKey()
    .$default(() => randomUUID()),
  ...timestamps,
}

export const sportsTable = pgTable('sports', {
  id: text('id').primaryKey(), // Sanity _id
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  displayName: varchar('display_name', { length: 256 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const sportsTableRelations = relations(sportsTable, ({ one, many }) => ({
  seasons: many(seasonsTable),
  conferenceSports: many(conferenceSportsTable),
  schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
  subdivisionSports: many(subdivisionSportsTables),
  voterBallots: many(voterBallots),
  weeklyFinalRankings: many(weeklyFinalRankings),
}))

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

export const voterBallotsRelations = relations(voterBallots, ({ one }) => ({
  sport: one(sportsTable, {
    fields: [voterBallots.sportId],
    references: [sportsTable.id],
  }),
}))

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

export const weeklyFinalRankingsRelations = relations(weeklyFinalRankings, ({ one }) => ({
  sport: one(sportsTable, {
    fields: [weeklyFinalRankings.sportId],
    references: [sportsTable.id],
  }),
}))

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
    ...defaultColumns,
    year: integer('year').notNull(),
    displayName: varchar('display_name', { length: 256 }),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    sportId: text('sport_id')
      .notNull()
      .references(() => sportsTable.id),
  },
  (table) => [unique().on(table.sportId, table.year)],
)

export const seasonsTableRelations = relations(seasonsTable, ({ one, many }) => ({
  sport: one(sportsTable, {
    fields: [seasonsTable.sportId],
    references: [sportsTable.id],
  }),
  seasonTypes: many(seasonTypesTable),
}))

export const seasonTypesTable = pgTable(
  'season_types',
  {
    ...defaultColumns,
    type: integer('type').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasonsTable.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.seasonId, table.type)],
)

export const seasonTypesTableRelations = relations(seasonTypesTable, ({ one, many }) => ({
  season: one(seasonsTable, {
    fields: [seasonTypesTable.seasonId],
    references: [seasonsTable.id],
  }),
  weeks: many(weeksTable),
}))

export const weeksTable = pgTable(
  'weeks',
  {
    ...defaultColumns,
    number: integer('number').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    text: varchar('text', { length: 256 }),
    seasonTypeId: text('season_type_id')
      .notNull()
      .references(() => seasonTypesTable.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.seasonTypeId, table.number)],
)

export const weeksTableRelations = relations(weeksTable, ({ one, many }) => ({
  seasonType: one(seasonTypesTable, {
    fields: [weeksTable.seasonTypeId],
    references: [seasonTypesTable.id],
  }),
}))

export const schoolsTable = pgTable(
  'schools',
  {
    ...defaultColumns,
    name: text('name'),
    sanityId: text('sanity_id'),
    shortName: text('short_name'),
    abbreviation: text(),
    nickname: text(),
    image: jsonb(),
    top25Eligible: boolean('top_25_eligible'),
  },
  (table) => [unique().on(table.sanityId)],
)

export const schoolsTableRelations = relations(schoolsTable, ({ many }) => ({
  schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
}))

export const conferencesTable = pgTable(
  'conferences',
  {
    ...defaultColumns,
    name: text('name'),
    sanityId: text('sanity_id'),
    divisionId: text('division_id'),
    shortName: text('short_name'),
    abbreviation: text(),
    slug: text(),
    logo: jsonb(),
  },
  (table) => [unique().on(table.sanityId)],
)

export const conferencesTableRelations = relations(conferencesTable, ({ many }) => ({
  conferenceSports: many(conferenceSportsTable),
  schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
}))

export const conferenceSportsTable = pgTable(
  'conference_sports',
  {
    ...defaultColumns,
    conferenceId: text('conference_id'),
    sportId: text('sport_id'),
  },
  (table) => [unique().on(table.conferenceId, table.sportId)],
)

export const conferenceSportsTableRelations = relations(conferenceSportsTable, ({ one }) => ({
  conference: one(conferencesTable, {
    fields: [conferenceSportsTable.conferenceId],
    references: [conferencesTable.id],
  }),
  sport: one(sportsTable, {
    fields: [conferenceSportsTable.sportId],
    references: [sportsTable.id],
  }),
}))

export const schoolConferenceAffiliationsTable = pgTable(
  'school_conference_affiliations',
  {
    ...defaultColumns,
    schoolId: text('school_id'),
    sportId: text('sport_id'),
    conferenceId: text('conference_id'),
  },
  (table) => [unique().on(table.schoolId, table.sportId, table.conferenceId)],
)

export const schoolConferenceAffiliationsTableRelations = relations(
  schoolConferenceAffiliationsTable,
  ({ one }) => ({
    school: one(schoolsTable, {
      fields: [schoolConferenceAffiliationsTable.schoolId],
      references: [schoolsTable.id],
    }),
    sport: one(sportsTable, {
      fields: [schoolConferenceAffiliationsTable.sportId],
      references: [sportsTable.id],
    }),
    conference: one(conferencesTable, {
      fields: [schoolConferenceAffiliationsTable.conferenceId],
      references: [conferencesTable.id],
    }),
  }),
)

export const divisionsTable = pgTable(
  'divisions',
  {
    ...defaultColumns,
    name: text(),
    title: text(),
    heading: text(),
    longName: text('long_name'),
    sanityId: text('sanity_id'),
    slug: text(),
    description: text(),
    logo: jsonb(),
  },
  (table) => [unique().on(table.sanityId)],
)

export const divisionsTableRelations = relations(divisionsTable, ({ many }) => ({
  subdivisions: many(subdivisionsTable),
}))

export const subdivisionsTable = pgTable(
  'subdivisions',
  {
    ...defaultColumns,
    name: text(),
    divisionId: text('division_id'),
    shortName: text('short_name'),
    slug: text(),
    sanityId: text('sanity_id'),
  },
  (table) => [unique().on(table.sanityId)],
)

export const subdivisionsTableRelations = relations(subdivisionsTable, ({ one, many }) => ({
  division: one(divisionsTable, {
    fields: [subdivisionsTable.divisionId],
    references: [divisionsTable.id],
  }),
  subdivisionSports: many(subdivisionSportsTables),
}))

export const subdivisionSportsTables = pgTable(
  'subdivision_sports',
  {
    ...defaultColumns,
    sportId: text('sport_id'),
    subdivisionId: text('subdivision_id'),
  },
  (table) => [unique().on(table.sportId, table.subdivisionId)],
)

export const subdivisionSportsTablesRelations = relations(subdivisionSportsTables, ({ one }) => ({
  sport: one(sportsTable, {
    fields: [subdivisionSportsTables.sportId],
    references: [sportsTable.id],
  }),
  subdivision: one(subdivisionsTable, {
    fields: [subdivisionSportsTables.subdivisionId],
    references: [subdivisionsTable.id],
  }),
}))

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
