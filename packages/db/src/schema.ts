import { randomUUID } from "node:crypto";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
};

const defaultColumns = {
  id: text("id")
    .primaryKey()
    .$default(() => randomUUID()),
  ...timestamps,
};

export const SEASON_TYPE_CODES = {
  PRESEASON: 1,
  REGULAR_SEASON: 2,
  POSTSEASON: 3,
  OFF_SEASON: 4,
} as const;

export const sportsTable = pgTable("sports", {
  id: text("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  displayName: varchar("display_name", { length: 256 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const voterBallots = pgTable(
  "voter_ballot",
  {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 256 }).notNull(),
    division: varchar("division", { length: 10 }).notNull(),
    week: integer("week").notNull(),
    year: integer("year")
      .default(sql`EXTRACT(year FROM CURRENT_DATE)`)
      .notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    teamId: varchar("team_id", { length: 256 }).notNull(),
    rank: integer("rank").notNull(),
    points: integer("points").notNull(),
    sportId: varchar("sport_id", { length: 256 }).references(
      () => sportsTable.id,
    ),
  },
  (table) => [
    unique().on(
      table.userId,
      table.division,
      table.week,
      table.year,
      table.sportId,
      table.teamId,
    ),
  ],
);

export const weeklyFinalRankings = pgTable(
  "weekly_final_rankings",
  {
    id: serial("id").primaryKey(),
    division: varchar("division", { length: 10 }).notNull(),
    sportId: varchar("sport_id", { length: 256 }).references(
      () => sportsTable.id,
    ),
    week: integer("week").notNull(),
    year: integer("year").notNull(),
    rankings: jsonb("rankings").notNull(),
    createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [unique().on(table.division, table.year, table.week)],
);

export const usersTable = pgTable("users_table", {
  id: text("id").primaryKey(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  organization: text("organization"),
  organizationRole: text("organizationRole"),
  isAdmin: boolean("isAdmin").default(false).notNull(),
  isVoter: boolean("isVoter").default(false).notNull(),
});

export const seasonsTable = pgTable(
  "seasons",
  {
    ...defaultColumns,
    year: integer("year").notNull(),
    displayName: varchar("display_name", { length: 256 }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
  },
  (table) => [unique().on(table.sportId, table.year)],
);

export const seasonTypesTable = pgTable(
  "season_types",
  {
    ...defaultColumns,
    type: integer("type").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasonsTable.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.seasonId, table.type)],
);

export const weeksTable = pgTable(
  "weeks",
  {
    ...defaultColumns,
    number: integer("number").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    text: varchar("text", { length: 256 }),
    seasonTypeId: text("season_type_id")
      .notNull()
      .references(() => seasonTypesTable.id, { onDelete: "cascade" }),
  },
  (table) => [unique().on(table.seasonTypeId, table.number)],
);

export const schoolsTable = pgTable(
  "schools",
  {
    ...defaultColumns,
    name: text("name"),
    sanityId: text("sanity_id"),
    shortName: text("short_name"),
    abbreviation: text(),
    nickname: text(),
    /** Public team hub URL slug from Sanity (`/college/teams/[slug]`). */
    slug: text(),
    image: jsonb(),
    top25Eligible: boolean("top_25_eligible"),
  },
  (table) => [
    unique().on(table.sanityId),
    index().on(table.sanityId),
    unique().on(table.slug),
  ],
);

export const conferencesTable = pgTable(
  "conferences",
  {
    ...defaultColumns,
    name: text("name"),
    sanityId: text("sanity_id"),
    divisionId: text("division_id"),
    shortName: text("short_name"),
    abbreviation: text(),
    slug: text(),
    logo: jsonb(),
  },
  (table) => [unique().on(table.sanityId), index().on(table.sanityId)],
);

export const conferenceSportsTable = pgTable(
  "conference_sports",
  {
    ...defaultColumns,
    conferenceId: text("conference_id").notNull(),
    sportId: text("sport_id").notNull(),
  },
  (table) => [unique().on(table.conferenceId, table.sportId)],
);

export const schoolConferenceAffiliationsTable = pgTable(
  "school_conference_affiliations",
  {
    ...defaultColumns,
    schoolId: text("school_id").notNull(),
    sportId: text("sport_id").notNull(),
    conferenceId: text("conference_id").notNull(),
  },
  (table) => [unique().on(table.schoolId, table.sportId, table.conferenceId)],
);

export const divisionsTable = pgTable(
  "divisions",
  {
    ...defaultColumns,
    name: text(),
    title: text(),
    heading: text(),
    longName: text("long_name"),
    sanityId: text("sanity_id"),
    slug: text(),
    description: text(),
    logo: jsonb(),
    parentDivisionId: text("parent_division_id"),
    isSubdivision: text("is_subdivision"),
  },
  (table) => [unique().on(table.sanityId), index().on(table.sanityId)],
);

export const divisionSportsTable = pgTable(
  "division_sports",
  {
    ...defaultColumns,
    sportId: text("sport_id").notNull(),
    divisionId: text("division_id").notNull(),
  },
  (table) => [unique().on(table.sportId, table.divisionId)],
);

export const weeklyRankings = pgTable(
  "weekly_team_rankings",
  {
    ...defaultColumns,
    schoolId: text("school_id").notNull(),
    divisionSportId: text("division_sport_id"),
    weekId: text("week_id").notNull(),
    ranking: integer(),
    points: integer(),
    firstPlaceVotes: integer("first_place_votes"),
    isTie: boolean("is_tie"),
  },
  (table) => [unique().on(table.divisionSportId, table.schoolId, table.weekId)],
);

/** First-class poll (Sport + Browse Scope operational product). */
/**
 * Poll-engine tables enable RLS in migration `0016_poll_engine.sql` with
 * **no policies**. That is intentional while the app connects with a
 * Supabase service-role / bypass role (DATABASE_URL). Browser/anon clients
 * must never receive this URL. Add RLS policies *before* exposing Supabase
 * to the client; do not add policies that lock out the current server role.
 */
export const pollsTable = pgTable(
  "polls",
  {
    ...defaultColumns,
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    divisionSportId: text("division_sport_id").references(
      () => divisionSportsTable.id,
    ),
  },
  (table) => [unique().on(table.sportId, table.slug), index().on(table.slug)],
);

export const pollVotersTable = pgTable(
  "poll_voters",
  {
    ...defaultColumns,
    pollId: text("poll_id")
      .notNull()
      .references(() => pollsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.pollId, table.userId),
    index().on(table.userId),
    index().on(table.pollId),
  ],
);

export const ballotsTable = pgTable(
  "ballots",
  {
    ...defaultColumns,
    pollId: text("poll_id")
      .notNull()
      .references(() => pollsTable.id),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id),
    weekId: text("week_id")
      .notNull()
      .references(() => weeksTable.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    unique().on(table.pollId, table.userId, table.weekId),
    index().on(table.pollId, table.weekId),
    index().on(table.userId, table.pollId),
  ],
);

export const ballotEntriesTable = pgTable(
  "ballot_entries",
  {
    ...defaultColumns,
    ballotId: text("ballot_id")
      .notNull()
      .references(() => ballotsTable.id, { onDelete: "cascade" }),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id),
    rank: integer("rank").notNull(),
    points: integer("points").notNull(),
  },
  (table) => [
    unique().on(table.ballotId, table.rank),
    unique().on(table.ballotId, table.schoolId),
    index().on(table.ballotId),
    index().on(table.schoolId),
  ],
);

/** Published Top 25 + others receiving votes. `rank` null = ORV only. */
export const pollRankingsTable = pgTable(
  "poll_rankings",
  {
    ...defaultColumns,
    pollId: text("poll_id")
      .notNull()
      .references(() => pollsTable.id),
    weekId: text("week_id")
      .notNull()
      .references(() => weeksTable.id),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id),
    rank: integer("rank"),
    points: integer("points").notNull(),
    firstPlaceVotes: integer("first_place_votes").default(0).notNull(),
    isTie: boolean("is_tie").default(false).notNull(),
  },
  (table) => [
    unique().on(table.pollId, table.weekId, table.schoolId),
    index().on(table.pollId, table.weekId),
    index().on(table.schoolId, table.pollId, table.weekId),
  ],
);

export const playersTable = pgTable(
  "players",
  {
    ...defaultColumns,
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    displayName: text("display_name"),
    sportId: text("sport_id").references(() => sportsTable.id),
    position: varchar("position", { length: 50 }),
    classYear: integer("class_year"),
    heightInches: integer("height_inches"),
    weightLbs: integer("weight_lbs"),
    headshotUrl: text("headshot_url"),
    hometown: text("hometown"),
    highSchool: text("high_school"),
    currentStatus: varchar("current_status", { length: 32 }),
    committedSchoolId: text("committed_school_id").references(
      () => schoolsTable.id,
    ),
    bio: text("bio"),
    socialLinks: jsonb("social_links"),
  },
  (table) => [index().on(table.slug), index().on(table.sportId)],
);

export const playerTimelineTable = pgTable(
  "player_timeline",
  {
    ...defaultColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    label: text("label").notNull(),
    schoolId: text("school_id").references(() => schoolsTable.id),
    sportId: text("sport_id").references(() => sportsTable.id),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
  },
  (table) => [index().on(table.playerId)],
);

export const playerCommitmentsTable = pgTable(
  "player_commitments",
  {
    ...defaultColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    schoolId: text("school_id").references(() => schoolsTable.id),
    sportId: text("sport_id").references(() => sportsTable.id),
    committedAt: timestamp("committed_at"),
    classYear: integer("class_year"),
  },
  (table) => [index().on(table.playerId), index().on(table.schoolId)],
);

export const playersTableRelations = relations(
  playersTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [playersTable.sportId],
      references: [sportsTable.id],
    }),
    committedSchool: one(schoolsTable, {
      fields: [playersTable.committedSchoolId],
      references: [schoolsTable.id],
    }),
    timeline: many(playerTimelineTable),
    commitments: many(playerCommitmentsTable),
  }),
);

export const playerTimelineTableRelations = relations(
  playerTimelineTable,
  ({ one }) => ({
    player: one(playersTable, {
      fields: [playerTimelineTable.playerId],
      references: [playersTable.id],
    }),
    school: one(schoolsTable, {
      fields: [playerTimelineTable.schoolId],
      references: [schoolsTable.id],
    }),
    sport: one(sportsTable, {
      fields: [playerTimelineTable.sportId],
      references: [sportsTable.id],
    }),
  }),
);

export const playerCommitmentsTableRelations = relations(
  playerCommitmentsTable,
  ({ one }) => ({
    player: one(playersTable, {
      fields: [playerCommitmentsTable.playerId],
      references: [playersTable.id],
    }),
    school: one(schoolsTable, {
      fields: [playerCommitmentsTable.schoolId],
      references: [schoolsTable.id],
    }),
    sport: one(sportsTable, {
      fields: [playerCommitmentsTable.sportId],
      references: [sportsTable.id],
    }),
  }),
);

export const sportsTableRelations = relations(sportsTable, ({ many }) => ({
  seasons: many(seasonsTable),
  conferenceSports: many(conferenceSportsTable),
  schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
  divisionSports: many(divisionSportsTable),
  voterBallots: many(voterBallots),
  weeklyFinalRankings: many(weeklyFinalRankings),
  polls: many(pollsTable),
}));

export const voterBallotsRelations = relations(voterBallots, ({ one }) => ({
  sport: one(sportsTable, {
    fields: [voterBallots.sportId],
    references: [sportsTable.id],
  }),
}));

export const weeklyFinalRankingsRelations = relations(
  weeklyFinalRankings,
  ({ one }) => ({
    sport: one(sportsTable, {
      fields: [weeklyFinalRankings.sportId],
      references: [sportsTable.id],
    }),
  }),
);

export const seasonsTableRelations = relations(
  seasonsTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [seasonsTable.sportId],
      references: [sportsTable.id],
    }),
    seasonTypes: many(seasonTypesTable),
  }),
);

export const seasonTypesTableRelations = relations(
  seasonTypesTable,
  ({ one, many }) => ({
    season: one(seasonsTable, {
      fields: [seasonTypesTable.seasonId],
      references: [seasonsTable.id],
    }),
    weeks: many(weeksTable),
  }),
);

export const weeksTableRelations = relations(weeksTable, ({ one, many }) => ({
  seasonType: one(seasonTypesTable, {
    fields: [weeksTable.seasonTypeId],
    references: [seasonTypesTable.id],
  }),
  ballots: many(ballotsTable),
  pollRankings: many(pollRankingsTable),
  weeklyRankings: many(weeklyRankings),
}));

export const schoolsTableRelations = relations(schoolsTable, ({ many }) => ({
  schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
  ballotEntries: many(ballotEntriesTable),
  pollRankings: many(pollRankingsTable),
}));

export const conferencesTableRelations = relations(
  conferencesTable,
  ({ many }) => ({
    conferenceSports: many(conferenceSportsTable),
    schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
  }),
);

export const conferenceSportsTableRelations = relations(
  conferenceSportsTable,
  ({ one }) => ({
    conference: one(conferencesTable, {
      fields: [conferenceSportsTable.conferenceId],
      references: [conferencesTable.id],
    }),
    sport: one(sportsTable, {
      fields: [conferenceSportsTable.sportId],
      references: [sportsTable.id],
    }),
  }),
);

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
);

export const divisionsTableRelations = relations(
  divisionsTable,
  ({ many }) => ({
    divisionSports: many(divisionSportsTable),
  }),
);

export const subdivisionSportsTableRelations = relations(
  divisionSportsTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [divisionSportsTable.sportId],
      references: [sportsTable.id],
    }),
    division: one(divisionsTable, {
      fields: [divisionSportsTable.divisionId],
      references: [divisionsTable.id],
    }),
    weeklyRankings: many(weeklyRankings),
    polls: many(pollsTable),
  }),
);

export const weeklyRankingsRelations = relations(weeklyRankings, ({ one }) => ({
  school: one(schoolsTable, {
    fields: [weeklyRankings.schoolId],
    references: [schoolsTable.id],
  }),
  divisionSport: one(divisionSportsTable, {
    fields: [weeklyRankings.divisionSportId],
    references: [divisionSportsTable.id],
  }),
  week: one(weeksTable, {
    fields: [weeklyRankings.weekId],
    references: [weeksTable.id],
  }),
}));

export const pollsTableRelations = relations(pollsTable, ({ one, many }) => ({
  sport: one(sportsTable, {
    fields: [pollsTable.sportId],
    references: [sportsTable.id],
  }),
  divisionSport: one(divisionSportsTable, {
    fields: [pollsTable.divisionSportId],
    references: [divisionSportsTable.id],
  }),
  voters: many(pollVotersTable),
  ballots: many(ballotsTable),
  rankings: many(pollRankingsTable),
}));

export const pollVotersTableRelations = relations(
  pollVotersTable,
  ({ one }) => ({
    poll: one(pollsTable, {
      fields: [pollVotersTable.pollId],
      references: [pollsTable.id],
    }),
    user: one(usersTable, {
      fields: [pollVotersTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export const ballotsTableRelations = relations(
  ballotsTable,
  ({ one, many }) => ({
    poll: one(pollsTable, {
      fields: [ballotsTable.pollId],
      references: [pollsTable.id],
    }),
    user: one(usersTable, {
      fields: [ballotsTable.userId],
      references: [usersTable.id],
    }),
    week: one(weeksTable, {
      fields: [ballotsTable.weekId],
      references: [weeksTable.id],
    }),
    entries: many(ballotEntriesTable),
  }),
);

export const ballotEntriesTableRelations = relations(
  ballotEntriesTable,
  ({ one }) => ({
    ballot: one(ballotsTable, {
      fields: [ballotEntriesTable.ballotId],
      references: [ballotsTable.id],
    }),
    school: one(schoolsTable, {
      fields: [ballotEntriesTable.schoolId],
      references: [schoolsTable.id],
    }),
  }),
);

export const pollRankingsTableRelations = relations(
  pollRankingsTable,
  ({ one }) => ({
    poll: one(pollsTable, {
      fields: [pollRankingsTable.pollId],
      references: [pollsTable.id],
    }),
    week: one(weeksTable, {
      fields: [pollRankingsTable.weekId],
      references: [weeksTable.id],
    }),
    school: one(schoolsTable, {
      fields: [pollRankingsTable.schoolId],
      references: [schoolsTable.id],
    }),
  }),
);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertSeason = typeof seasonsTable.$inferInsert;
export type InsertSeasonType = typeof seasonTypesTable.$inferInsert;
export type InsertWeeks = typeof weeksTable.$inferInsert;
export type InsertSchoolConferenceAffiliations =
  typeof schoolConferenceAffiliationsTable.$inferInsert;
export type InsertConferenceSports = typeof conferenceSportsTable.$inferInsert;
export type InsertDivisionSports = typeof divisionSportsTable.$inferInsert;
export type SelectSchool = typeof schoolsTable.$inferSelect;
export type SelectWeeklyRankings = typeof weeklyRankings.$inferSelect;
export type SelectPoll = typeof pollsTable.$inferSelect;
export type SelectBallot = typeof ballotsTable.$inferSelect;
export type SelectPollRanking = typeof pollRankingsTable.$inferSelect;
export type SelectPlayer = typeof playersTable.$inferSelect;
export type InsertPlayer = typeof playersTable.$inferInsert;
