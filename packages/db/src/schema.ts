import { randomUUID } from "node:crypto";
import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

import {
  CLOSED_RECRUITMENT_STATUSES,
  EVENT_SOURCE_TYPES,
  FIRST_PLAYER_ID,
  PLAYER_CLASS_CODES,
  PLAYER_SUBMISSION_STATUSES,
  PLAYER_SUBMITTER_ROLES,
  PORTAL_PUSH_TRIGGERS,
  RECRUITMENT_EVENT_TYPES,
  RECRUITMENT_KINDS,
  RECRUITMENT_STATUSES,
  SCHOOL_EVENT_TYPES,
} from "./portal/constants";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
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
  createdAt: timestamp("created_at", { withTimezone: true }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(
    sql`CURRENT_TIMESTAMP`,
  ),
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
    createdAt: timestamp("created_at", { withTimezone: true })
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
    index().on(table.sportId),
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
    createdAt: timestamp("created_at", { withTimezone: true }).default(
      sql`CURRENT_TIMESTAMP`,
    ),
  },
  (table) => [
    unique().on(table.division, table.year, table.week),
    index().on(table.sportId),
  ],
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
  (table) => [
    // Unique (season_type_id, number) already covers season_type_id-leading
    // lookups/joins — no separate season_type_id index needed.
    unique().on(table.seasonTypeId, table.number),
  ],
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
  (table) => [unique().on(table.sanityId), unique().on(table.slug)],
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
  (table) => [
    unique().on(table.sanityId),
    index("conferences_division_id_index").on(table.divisionId),
  ],
);

export const conferenceSportsTable = pgTable(
  "conference_sports",
  {
    ...defaultColumns,
    conferenceId: text("conference_id").notNull(),
    sportId: text("sport_id").notNull(),
  },
  (table) => [
    unique().on(table.conferenceId, table.sportId),
    index("conference_sports_sport_id_index").on(table.sportId),
  ],
);

export const schoolConferenceAffiliationsTable = pgTable(
  "school_conference_affiliations",
  {
    ...defaultColumns,
    schoolId: text("school_id").notNull(),
    sportId: text("sport_id").notNull(),
    conferenceId: text("conference_id").notNull(),
  },
  (table) => [
    unique().on(table.schoolId, table.sportId, table.conferenceId),
    index("school_conference_affiliations_sport_id_index").on(table.sportId),
    index("school_conference_affiliations_conference_id_index").on(
      table.conferenceId,
    ),
  ],
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
    isSubdivision: boolean("is_subdivision"),
  },
  (table) => [
    unique().on(table.sanityId),
    index("divisions_parent_division_id_index").on(table.parentDivisionId),
  ],
);

export const divisionSportsTable = pgTable(
  "division_sports",
  {
    ...defaultColumns,
    sportId: text("sport_id").notNull(),
    divisionId: text("division_id").notNull(),
  },
  (table) => [
    unique().on(table.sportId, table.divisionId),
    index("division_sports_division_id_index").on(table.divisionId),
  ],
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
  (table) => [
    unique().on(table.divisionSportId, table.schoolId, table.weekId),
    index("weekly_team_rankings_school_id_index").on(table.schoolId),
    index("weekly_team_rankings_week_id_index").on(table.weekId),
  ],
);

/** First-class poll (Sport + Browse Scope operational product). */
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
    /** Publish the voting week from the Monday 9 AM Central cron. Off = manual only. */
    autoPublish: boolean("auto_publish").default(false).notNull(),
    divisionSportId: text("division_sport_id").references(
      () => divisionSportsTable.id,
    ),
  },
  (table) => [
    unique().on(table.sportId, table.slug),
    index().on(table.slug),
    // FK cover for division_sport_id (not leading in any existing index).
    index().on(table.divisionSportId),
  ],
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
    /** Set with revoked_at when unexcused missed ballots hit the limit. */
    lockedOutAt: timestamp("locked_out_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.pollId, table.userId),
    index().on(table.userId),
    index().on(table.pollId),
    index("poll_voters_active_poll_id_index")
      .on(table.pollId)
      .where(sql`${table.revokedAt} is null`),
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
    // FK cover for week_id (composite indexes are poll_id-leading).
    index().on(table.weekId),
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

/**
 * An assigned voter with no ballot when a poll week was published. Written at
 * publish (the assignment as it was then), cleared if a later re-publish finds
 * their ballot. Excused misses never count toward the lockout.
 */
export const pollMissedBallotsTable = pgTable(
  "poll_missed_ballots",
  {
    ...defaultColumns,
    pollId: text("poll_id")
      .notNull()
      .references(() => pollsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id),
    weekId: text("week_id")
      .notNull()
      .references(() => weeksTable.id),
    excusedAt: timestamp("excused_at", { withTimezone: true }),
    excuseNote: text("excuse_note"),
  },
  (table) => [
    unique().on(table.pollId, table.userId, table.weekId),
    index().on(table.pollId, table.weekId),
    index().on(table.userId),
    index().on(table.weekId),
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
    index().on(table.pollId, table.weekId, table.rank, table.points),
    index().on(table.schoolId, table.pollId, table.weekId),
    // FK cover for week_id (composite indexes are poll_id / school_id-leading).
    index().on(table.weekId),
  ],
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

/**
 * Versioned bracket tree. `spec` is the whole tree (slots, games, feeders) and
 * never changes once editions point at it: a new format ships as a new row with
 * a new `key`. `divisionSlug` is the football subdivision ("fcs", "fbs"); null
 * for basketball, where one NCAA tournament covers every poll slice.
 */
export const bracketFormatsTable = pgTable(
  "bracket_formats",
  {
    ...defaultColumns,
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    divisionSlug: text("division_slug"),
    key: text("key").notNull().unique(),
    effectiveFromYear: integer("effective_from_year").notNull(),
    /** Inclusive. Null means the format is still current. */
    effectiveToYear: integer("effective_to_year"),
    spec: jsonb("spec").notNull(),
  },
  (table) => [
    unique("bracket_formats_sport_division_from_year_unique")
      .on(table.sportId, table.divisionSlug, table.effectiveFromYear)
      .nullsNotDistinct(),
  ],
);

/**
 * One bracket for a format and season: a weekly projection (`weekId` set) or
 * the committee's official bracket (`weekId` null). Editing a published edition
 * updates it in place, so every article that embeds it shows the fix.
 */
export const bracketEditionsTable = pgTable(
  "bracket_editions",
  {
    ...defaultColumns,
    formatId: text("format_id")
      .notNull()
      .references(() => bracketFormatsTable.id),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasonsTable.id),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("draft"),
    weekId: text("week_id").references(() => weeksTable.id),
    articleUrl: text("article_url"),
    publicNote: text("public_note"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedByUserId: text("published_by_user_id").references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    check(
      "bracket_editions_kind_check",
      sql`${table.kind} in ('projection', 'official')`,
    ),
    check(
      "bracket_editions_status_check",
      sql`${table.status} in ('draft', 'published')`,
    ),
    check(
      "bracket_editions_week_check",
      sql`(${table.kind} = 'projection') = (${table.weekId} is not null)`,
    ),
    check(
      "bracket_editions_published_at_check",
      sql`${table.status} <> 'published' or ${table.publishedAt} is not null`,
    ),
    check(
      "bracket_editions_article_url_check",
      sql`${table.articleUrl} is null or ${table.articleUrl} ~ '^https?://'`,
    ),
    // One projection per week and one official bracket per season. Also
    // serves the public "editions for this format and season" read.
    unique("bracket_editions_identity_unique")
      .on(table.formatId, table.seasonId, table.kind, table.weekId)
      .nullsNotDistinct(),
    index("bracket_editions_season_id_index").on(table.seasonId),
    index("bracket_editions_week_id_index").on(table.weekId),
    index("bracket_editions_published_by_user_id_index").on(
      table.publishedByUserId,
    ),
  ],
);

/**
 * A school placed in one of the format's slots. Rows exist only for filled
 * slots; seed, region and seed visibility come from the format spec.
 */
export const bracketSlotsTable = pgTable(
  "bracket_slots",
  {
    ...defaultColumns,
    editionId: text("edition_id")
      .notNull()
      .references(() => bracketEditionsTable.id, { onDelete: "cascade" }),
    slotKey: text("slot_key").notNull(),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id),
    bidType: text("bid_type"),
    bidLabel: text("bid_label"),
  },
  (table) => [
    unique("bracket_slots_edition_id_slot_key_unique").on(
      table.editionId,
      table.slotKey,
    ),
    unique("bracket_slots_edition_id_school_id_unique").on(
      table.editionId,
      table.schoolId,
    ),
    check(
      "bracket_slots_bid_type_check",
      sql`${table.bidType} is null or ${table.bidType} in ('auto', 'at-large')`,
    ),
    index("bracket_slots_school_id_index").on(table.schoolId),
  ],
);

/**
 * State for one game of the format's tree. Rows exist only once a game has a
 * site, kickoff, score or home override. Sides follow the spec: `a` is the
 * spec's `sideA`. The winning school comes from the slots, never stored here.
 */
export const bracketGamesTable = pgTable(
  "bracket_games",
  {
    ...defaultColumns,
    editionId: text("edition_id")
      .notNull()
      .references(() => bracketEditionsTable.id, { onDelete: "cascade" }),
    gameKey: text("game_key").notNull(),
    /** Overrides the spec's `host` when set. */
    homeSide: text("home_side"),
    siteLabel: text("site_label"),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }),
    status: text("status").notNull().default("scheduled"),
    sideAScore: integer("side_a_score"),
    sideBScore: integer("side_b_score"),
    winnerSide: text("winner_side"),
    /** The scoreboard row this game was played as, for result sync. */
    gameId: text("game_id").references(() => gamesTable.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    unique("bracket_games_edition_id_game_key_unique").on(
      table.editionId,
      table.gameKey,
    ),
    check(
      "bracket_games_home_side_check",
      sql`${table.homeSide} is null or ${table.homeSide} in ('a', 'b')`,
    ),
    check(
      "bracket_games_winner_side_check",
      sql`${table.winnerSide} is null or ${table.winnerSide} in ('a', 'b')`,
    ),
    check(
      "bracket_games_status_check",
      sql`${table.status} in ('scheduled', 'final')`,
    ),
    check(
      "bracket_games_final_winner_check",
      sql`(${table.status} = 'final') = (${table.winnerSide} is not null)`,
    ),
    check(
      "bracket_games_scores_check",
      sql`(${table.sideAScore} is null or ${table.sideAScore} >= 0) and (${table.sideBScore} is null or ${table.sideBScore} >= 0)`,
    ),
    index("bracket_games_game_id_index").on(table.gameId),
  ],
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

export const bracketFormatsTableRelations = relations(
  bracketFormatsTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [bracketFormatsTable.sportId],
      references: [sportsTable.id],
    }),
    editions: many(bracketEditionsTable),
  }),
);

export const bracketEditionsTableRelations = relations(
  bracketEditionsTable,
  ({ one, many }) => ({
    format: one(bracketFormatsTable, {
      fields: [bracketEditionsTable.formatId],
      references: [bracketFormatsTable.id],
    }),
    season: one(seasonsTable, {
      fields: [bracketEditionsTable.seasonId],
      references: [seasonsTable.id],
    }),
    week: one(weeksTable, {
      fields: [bracketEditionsTable.weekId],
      references: [weeksTable.id],
    }),
    publishedBy: one(usersTable, {
      fields: [bracketEditionsTable.publishedByUserId],
      references: [usersTable.id],
    }),
    slots: many(bracketSlotsTable),
    games: many(bracketGamesTable),
  }),
);

export const bracketSlotsTableRelations = relations(
  bracketSlotsTable,
  ({ one }) => ({
    edition: one(bracketEditionsTable, {
      fields: [bracketSlotsTable.editionId],
      references: [bracketEditionsTable.id],
    }),
    school: one(schoolsTable, {
      fields: [bracketSlotsTable.schoolId],
      references: [schoolsTable.id],
    }),
  }),
);

export const bracketGamesTableRelations = relations(
  bracketGamesTable,
  ({ one }) => ({
    edition: one(bracketEditionsTable, {
      fields: [bracketGamesTable.editionId],
      references: [bracketEditionsTable.id],
    }),
    game: one(gamesTable, {
      fields: [bracketGamesTable.gameId],
      references: [gamesTable.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Rating pools: computer ratings and strength of schedule counted only on games
// where both teams belong to the same pool (FCS vs FCS, mid-major vs mid-major…).
// ---------------------------------------------------------------------------

export const EXTERNAL_ID_PROVIDERS = ["espn", "ncaa"] as const;

/**
 * A school's id at an outside data provider. Providers use one id per school across
 * sports (ESPN's McNeese is 2377 in football and both basketballs). Edited in admin.
 */
export const schoolExternalIdsTable = pgTable(
  "school_external_ids",
  {
    ...defaultColumns,
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
  },
  (table) => [
    unique("school_external_ids_provider_external_id_unique").on(
      table.provider,
      table.externalId,
    ),
    unique("school_external_ids_school_id_provider_unique").on(
      table.schoolId,
      table.provider,
    ),
    check(
      "school_external_ids_provider_check",
      sql`${table.provider} in ('espn', 'ncaa')`,
    ),
  ],
);

export const GAME_SOURCES = ["espn", "ncaa"] as const;

/** Every game ingested for a sport's season. Sides that aren't Redshirt schools keep their raw names. */
export const gamesTable = pgTable(
  "games",
  {
    ...defaultColumns,
    seasonId: text("season_id")
      .notNull()
      .references(() => seasonsTable.id, { onDelete: "cascade" }),
    weekId: text("week_id").references(() => weeksTable.id),
    seasonType: integer("season_type").notNull(),
    homeSchoolId: text("home_school_id").references(() => schoolsTable.id),
    awaySchoolId: text("away_school_id").references(() => schoolsTable.id),
    homeExternalId: text("home_external_id"),
    awayExternalId: text("away_external_id"),
    homeName: text("home_name").notNull(),
    awayName: text("away_name").notNull(),
    /** Without the mascot ("Arizona"). */
    homeShortName: text("home_short_name"),
    awayShortName: text("away_short_name"),
    /** Level that season ("FBS", "FCS", "DII", "DIII"), from the pool's levelGroups; null if unknown. */
    homeLevel: text("home_level"),
    awayLevel: text("away_level"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    neutralSite: boolean("neutral_site").notNull().default(false),
    overtime: boolean("overtime").notNull().default(false),
    status: text("status").notNull(),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }),
    source: text("source").notNull(),
    sourceGameId: text("source_game_id").notNull(),
    /** Kickoff date + both sides, so two sources can never store the same game twice. */
    dedupeKey: text("dedupe_key").notNull(),
  },
  (table) => [
    unique("games_source_source_game_id_unique").on(
      table.source,
      table.sourceGameId,
    ),
    unique("games_season_id_dedupe_key_unique").on(
      table.seasonId,
      table.dedupeKey,
    ),
    check(
      "games_status_check",
      sql`${table.status} in ('scheduled', 'in_progress', 'final', 'postponed', 'cancelled')`,
    ),
    check("games_source_check", sql`${table.source} in ('espn', 'ncaa')`),
    index("games_week_id_index").on(table.weekId),
    index("games_home_school_id_index").on(table.homeSchoolId),
    index("games_away_school_id_index").on(table.awaySchoolId),
  ],
);

/**
 * A rated group of teams within one sport (FCS football, mid-major men's basketball…).
 * Membership, data sources, schedule, and model parameters are config, so a new pool is a new row.
 */
export const ratingPoolsTable = pgTable(
  "rating_pools",
  {
    ...defaultColumns,
    divisionSportId: text("division_sport_id")
      .notNull()
      .references(() => divisionSportsTable.id),
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    /** URL segment, matching the division slug: /college/{sport}/ratings/{slug}. */
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    /** Synced and computed by the cron. */
    isActive: boolean("is_active").notNull().default(false),
    /** Published on the public site and in the sitemap. */
    isPublic: boolean("is_public").notNull().default(false),
    /** See PoolDefinition in ratings/pools.ts. */
    membership: jsonb("membership").notNull(),
    source: jsonb("source").notNull(),
    schedule: jsonb("schedule").notNull(),
    config: jsonb("config").notNull(),
    methodVersion: integer("method_version").notNull(),
  },
  (table) => [
    unique("rating_pools_sport_id_slug_unique").on(table.sportId, table.slug),
    index("rating_pools_division_sport_id_index").on(table.divisionSportId),
  ],
);

/** Who was in a pool in a given season, and their conference that season. */
export const ratingPoolMembersTable = pgTable(
  "rating_pool_members",
  {
    ...defaultColumns,
    poolId: text("pool_id")
      .notNull()
      .references(() => ratingPoolsTable.id, { onDelete: "cascade" }),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasonsTable.id, { onDelete: "cascade" }),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id),
    conferenceId: text("conference_id").references(() => conferencesTable.id),
    /** The conference that season, from the provider (realignment-proof). */
    conferenceName: text("conference_name"),
  },
  (table) => [
    unique("rating_pool_members_pool_season_school_unique").on(
      table.poolId,
      table.seasonId,
      table.schoolId,
    ),
    index("rating_pool_members_season_id_index").on(table.seasonId),
    index("rating_pool_members_school_id_index").on(table.schoolId),
  ],
);

export const RATING_RUN_STATUSES = [
  "draft",
  "published",
  "superseded",
] as const;
export const RATING_TRIGGERS = ["cron", "admin", "cli"] as const;

/** One computation of a pool as of one week. Immutable once written; publishing only flips status. */
export const ratingRunsTable = pgTable(
  "rating_runs",
  {
    ...defaultColumns,
    poolId: text("pool_id")
      .notNull()
      .references(() => ratingPoolsTable.id, { onDelete: "cascade" }),
    seasonId: text("season_id")
      .notNull()
      .references(() => seasonsTable.id),
    weekId: text("week_id")
      .notNull()
      .references(() => weeksTable.id),
    /** Latest kickoff counted, so a page can say "through Saturday's games". */
    throughAt: timestamp("through_at", { withTimezone: true }),
    methodVersion: integer("method_version").notNull(),
    /** The exact config used, so any run can be reproduced. */
    params: jsonb("params").notNull(),
    diagnostics: jsonb("diagnostics").notNull(),
    /** sha256 of every input game, the membership, and the params. */
    checksum: text("checksum").notNull(),
    gameCount: integer("game_count").notNull(),
    status: text("status").notNull().default("draft"),
    trigger: text("trigger").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: text("published_by"),
  },
  (table) => [
    check(
      "rating_runs_status_check",
      sql`${table.status} in ('draft', 'published', 'superseded')`,
    ),
    check(
      "rating_runs_trigger_check",
      sql`${table.trigger} in ('cron', 'admin', 'cli')`,
    ),
    uniqueIndex("rating_runs_one_published_per_week")
      .on(table.poolId, table.weekId)
      .where(sql`${table.status} = 'published'`),
    index("rating_runs_pool_week_index").on(table.poolId, table.weekId),
    index("rating_runs_season_id_index").on(table.seasonId),
    index("rating_runs_week_id_index").on(table.weekId),
  ],
);

/** One team's numbers in one run. See ratings/engine/types.ts TeamRating for meanings. */
export const ratingSnapshotsTable = pgTable(
  "rating_snapshots",
  {
    ...defaultColumns,
    runId: text("run_id")
      .notNull()
      .references(() => ratingRunsTable.id, { onDelete: "cascade" }),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id),
    conferenceId: text("conference_id").references(() => conferencesTable.id),
    /** Conference as of this run's season, frozen with the run. */
    conferenceName: text("conference_name"),
    power: doublePrecision("power").notNull(),
    powerLow: doublePrecision("power_low").notNull(),
    powerHigh: doublePrecision("power_high").notNull(),
    powerRank: integer("power_rank").notNull(),
    powerRankLow: integer("power_rank_low").notNull(),
    powerRankHigh: integer("power_rank_high").notNull(),
    strength: doublePrecision("strength").notNull(),
    sor: doublePrecision("sor"),
    sorRank: integer("sor_rank"),
    sorRankLow: integer("sor_rank_low"),
    sorRankHigh: integer("sor_rank_high"),
    sos: doublePrecision("sos"),
    sosRank: integer("sos_rank"),
    sosRankLow: integer("sos_rank_low"),
    sosRankHigh: integer("sos_rank_high"),
    sov: doublePrecision("sov"),
    sovRank: integer("sov_rank"),
    sol: doublePrecision("sol"),
    recordSos: doublePrecision("record_sos"),
    recordSosRank: integer("record_sos_rank"),
    owp: doublePrecision("owp"),
    oowp: doublePrecision("oowp"),
    averageOpponentStrength: doublePrecision("average_opponent_strength"),
    remainingSos: doublePrecision("remaining_sos"),
    fullSeasonSos: doublePrecision("full_season_sos"),
    poolWins: integer("pool_wins").notNull(),
    poolLosses: integer("pool_losses").notNull(),
    poolTies: integer("pool_ties").notNull(),
    overallWins: integer("overall_wins").notNull(),
    overallLosses: integer("overall_losses").notNull(),
    overallTies: integer("overall_ties").notNull(),
    poolGames: integer("pool_games").notNull(),
    tierRecords: jsonb("tier_records").notNull(),
    isProvisional: boolean("is_provisional").notNull(),
    explanation: jsonb("explanation").notNull(),
  },
  (table) => [
    unique("rating_snapshots_run_id_school_id_unique").on(
      table.runId,
      table.schoolId,
    ),
    index("rating_snapshots_school_id_index").on(table.schoolId),
  ],
);

export const RATING_JOB_KINDS = [
  "sync",
  "compute",
  "publish",
  "pipeline",
] as const;
export const RATING_JOB_STATUSES = [
  "running",
  "succeeded",
  "skipped",
  "failed",
] as const;

/** Every sync/compute/publish attempt, for the admin log and debugging. */
export const ratingJobsTable = pgTable(
  "rating_jobs",
  {
    ...defaultColumns,
    poolId: text("pool_id").references(() => ratingPoolsTable.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    trigger: text("trigger").notNull(),
    status: text("status").notNull(),
    request: jsonb("request"),
    lines: jsonb("lines").notNull().default(sql`'[]'::jsonb`),
    error: text("error"),
    runId: text("run_id").references(() => ratingRunsTable.id, {
      onDelete: "set null",
    }),
    actor: text("actor"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "rating_jobs_kind_check",
      sql`${table.kind} in ('sync', 'compute', 'publish', 'pipeline')`,
    ),
    check(
      "rating_jobs_status_check",
      sql`${table.status} in ('running', 'succeeded', 'skipped', 'failed')`,
    ),
    index("rating_jobs_pool_started_index").on(table.poolId, table.startedAt),
    // At most one running job per pool: the lock that keeps cron and admin from overlapping.
    uniqueIndex("rating_jobs_one_running_per_pool")
      .on(table.poolId)
      .where(sql`${table.status} = 'running'`),
    index("rating_jobs_run_id_index").on(table.runId),
  ],
);

export const ratingPoolsTableRelations = relations(
  ratingPoolsTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [ratingPoolsTable.sportId],
      references: [sportsTable.id],
    }),
    divisionSport: one(divisionSportsTable, {
      fields: [ratingPoolsTable.divisionSportId],
      references: [divisionSportsTable.id],
    }),
    runs: many(ratingRunsTable),
    members: many(ratingPoolMembersTable),
  }),
);

export const ratingRunsTableRelations = relations(
  ratingRunsTable,
  ({ one, many }) => ({
    pool: one(ratingPoolsTable, {
      fields: [ratingRunsTable.poolId],
      references: [ratingPoolsTable.id],
    }),
    season: one(seasonsTable, {
      fields: [ratingRunsTable.seasonId],
      references: [seasonsTable.id],
    }),
    week: one(weeksTable, {
      fields: [ratingRunsTable.weekId],
      references: [weeksTable.id],
    }),
    snapshots: many(ratingSnapshotsTable),
  }),
);

export const ratingSnapshotsTableRelations = relations(
  ratingSnapshotsTable,
  ({ one }) => ({
    run: one(ratingRunsTable, {
      fields: [ratingSnapshotsTable.runId],
      references: [ratingRunsTable.id],
    }),
    school: one(schoolsTable, {
      fields: [ratingSnapshotsTable.schoolId],
      references: [schoolsTable.id],
    }),
  }),
);

export const ratingPoolMembersTableRelations = relations(
  ratingPoolMembersTable,
  ({ one }) => ({
    pool: one(ratingPoolsTable, {
      fields: [ratingPoolMembersTable.poolId],
      references: [ratingPoolsTable.id],
    }),
    school: one(schoolsTable, {
      fields: [ratingPoolMembersTable.schoolId],
      references: [schoolsTable.id],
    }),
  }),
);

export const gamesTableRelations = relations(gamesTable, ({ one }) => ({
  season: one(seasonsTable, {
    fields: [gamesTable.seasonId],
    references: [seasonsTable.id],
  }),
  week: one(weeksTable, {
    fields: [gamesTable.weekId],
    references: [weeksTable.id],
  }),
}));

// ---------------------------------------------------------------------------
// Players, recruitments, and the transfer portal.
//
// Working tables (players … recruitment_events) are written by admin and hold
// the integrity rules. Public pages never read them: the push copies what is
// ready into `published_players` and `published_wire_events`.
//
// These tables use identity keys rather than the text UUIDs above: the player
// id is public (`/players/<name>-<id>`) and the rest follow it for consistency.
// ---------------------------------------------------------------------------

const identityId = () =>
  bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity();

const requiredTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** `column in ('a', 'b')` from one of the `as const` arrays in `portal/constants`. */
const inList = (column: AnyPgColumn, values: readonly string[]) =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

/** A school we know (`school_id`) or one we don't yet (`school_name`, e.g. NAIA or JUCO). */
const hasSchool = (schoolId: AnyPgColumn, schoolName: AnyPgColumn) =>
  sql`(${schoolId} is not null or ${schoolName} is not null)`;

/** A person. One row for life, across sports, schools, and recruitments. */
export const playersTable = pgTable(
  "players",
  {
    /** Permanent and public: the number in `/players/<name>-<id>`. */
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity({ startWith: FIRST_PLAYER_ID }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    suffix: text("suffix"),
    /** From the name. Not unique and never used to find a player. */
    slug: text("slug").notNull(),
    /** `normalizePlayerName(first, last, suffix)`, for duplicate matching. */
    nameSearch: text("name_search").notNull(),
    hometownCity: text("hometown_city"),
    hometownState: text("hometown_state"),
    highSchoolName: text("high_school_name"),
    hsGradYear: smallint("hs_grad_year"),
    /** Reserved. The site shows a silhouette while this is null. */
    headshot: jsonb("headshot"),
    /** Set when this row was merged into another; the row stays so its URL can redirect. */
    mergedIntoId: bigint("merged_into_id", { mode: "number" }).references(
      (): AnyPgColumn => playersTable.id,
    ),
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    /** When the oldest unpublished change was saved. Null once pushed. */
    pendingSince: timestamp("pending_since", { withTimezone: true }),
    ...requiredTimestamps,
  },
  (table) => [
    check(
      "players_merged_into_id_check",
      sql`${table.mergedIntoId} is null or ${table.mergedIntoId} <> ${table.id}`,
    ),
    check(
      "players_hs_grad_year_check",
      sql`${table.hsGradYear} is null or ${table.hsGradYear} between 1990 and 2100`,
    ),
    index("players_name_search_trgm_index").using(
      "gin",
      sql`${table.nameSearch} extensions.gin_trgm_ops`,
    ),
    index("players_pending_since_index")
      .on(table.pendingSince)
      .where(sql`${table.pendingSince} is not null`),
    index("players_merged_into_id_index")
      .on(table.mergedIntoId)
      .where(sql`${table.mergedIntoId} is not null`),
  ],
);

/** A player in one sport. Position and measurables belong here, not on the person. */
export const playerSportsTable = pgTable(
  "player_sports",
  {
    id: identityId(),
    playerId: bigint("player_id", { mode: "number" })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    /** A code from `POSITIONS_BY_SPORT`; validated in code because it depends on the sport. */
    position: text("position"),
    heightIn: smallint("height_in"),
    weightLb: smallint("weight_lb"),
    ...requiredTimestamps,
  },
  (table) => [
    unique("player_sports_player_id_sport_id_unique").on(
      table.playerId,
      table.sportId,
    ),
    check(
      "player_sports_height_in_check",
      sql`${table.heightIn} is null or ${table.heightIn} between 48 and 96`,
    ),
    check(
      "player_sports_weight_lb_check",
      sql`${table.weightLb} is null or ${table.weightLb} between 80 and 500`,
    ),
    index("player_sports_sport_id_index").on(table.sportId),
  ],
);

/** Where a player is or was rostered. The row with no `end_year` is the current school. */
export const playerEnrollmentsTable = pgTable(
  "player_enrollments",
  {
    id: identityId(),
    playerSportId: bigint("player_sport_id", { mode: "number" })
      .notNull()
      .references(() => playerSportsTable.id, { onDelete: "cascade" }),
    schoolId: text("school_id").references(() => schoolsTable.id),
    schoolName: text("school_name"),
    /** First season at the school. */
    startYear: smallint("start_year").notNull(),
    /** Last season at the school; null while still there. */
    endYear: smallint("end_year"),
    /** The recruitment whose `enrolled` event created this row. */
    viaRecruitmentId: bigint("via_recruitment_id", {
      mode: "number",
    }).references((): AnyPgColumn => recruitmentsTable.id, {
      onDelete: "set null",
    }),
    ...requiredTimestamps,
  },
  (table) => [
    check(
      "player_enrollments_school_check",
      hasSchool(table.schoolId, table.schoolName),
    ),
    check(
      "player_enrollments_years_check",
      sql`${table.endYear} is null or ${table.endYear} >= ${table.startYear}`,
    ),
    uniqueIndex("player_enrollments_one_current_per_player_sport")
      .on(table.playerSportId)
      .where(sql`${table.endYear} is null`),
    index("player_enrollments_player_sport_id_index").on(table.playerSportId),
    index("player_enrollments_school_id_start_year_index").on(
      table.schoolId,
      table.startYear,
    ),
    index("player_enrollments_via_recruitment_id_index").on(
      table.viaRecruitmentId,
    ),
  ],
);

/**
 * One trip through the market: a portal entry now, a high school recruitment
 * later. Open from `entered` until the player enrolls somewhere or withdraws,
 * however many times they commit and re-enter in between.
 *
 * The status columns are derived from `recruitment_events` by
 * `reduceRecruitment` and rewritten in the same transaction as every event.
 */
export const recruitmentsTable = pgTable(
  "recruitments",
  {
    id: identityId(),
    playerSportId: bigint("player_sport_id", { mode: "number" })
      .notNull()
      .references(() => playerSportsTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("transfer"),
    /** The cycle's label: the season the player would next play (2027 for the January 2027 window). */
    cycleYear: smallint("cycle_year").notNull(),
    originEnrollmentId: bigint("origin_enrollment_id", {
      mode: "number",
    }).references((): AnyPgColumn => playerEnrollmentsTable.id, {
      onDelete: "set null",
    }),
    // Origin and destination are snapshots: a school that later changes
    // division or conference must not rewrite this move.
    originSchoolId: text("origin_school_id").references(() => schoolsTable.id),
    originSchoolName: text("origin_school_name"),
    originDivisionId: text("origin_division_id").references(
      () => divisionsTable.id,
    ),
    originConferenceId: text("origin_conference_id").references(
      () => conferencesTable.id,
    ),
    /** A `PLAYER_CLASSES` code, frozen for this cycle. */
    classAtEntry: text("class_at_entry"),
    eligibilityYears: smallint("eligibility_years"),
    isGradTransfer: boolean("is_grad_transfer").notNull().default(false),
    status: text("status").notNull().default("entered"),
    statusAt: timestamp("status_at", { withTimezone: true }).notNull(),
    enteredAt: timestamp("entered_at", { withTimezone: true }).notNull(),
    destinationSchoolId: text("destination_school_id").references(
      () => schoolsTable.id,
    ),
    destinationSchoolName: text("destination_school_name"),
    destinationDivisionId: text("destination_division_id").references(
      () => divisionsTable.id,
    ),
    destinationConferenceId: text("destination_conference_id").references(
      () => conferencesTable.id,
    ),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...requiredTimestamps,
  },
  (table) => [
    check("recruitments_kind_check", inList(table.kind, RECRUITMENT_KINDS)),
    check(
      "recruitments_status_check",
      inList(table.status, RECRUITMENT_STATUSES),
    ),
    check(
      "recruitments_class_at_entry_check",
      sql`${table.classAtEntry} is null or ${inList(table.classAtEntry, PLAYER_CLASS_CODES)}`,
    ),
    check(
      "recruitments_cycle_year_check",
      sql`${table.cycleYear} between 2000 and 2100`,
    ),
    check(
      "recruitments_eligibility_years_check",
      sql`${table.eligibilityYears} is null or ${table.eligibilityYears} between 0 and 6`,
    ),
    check(
      "recruitments_closed_check",
      sql`(${inList(table.status, CLOSED_RECRUITMENT_STATUSES)}) = (${table.closedAt} is not null)`,
    ),
    check(
      "recruitments_destination_check",
      sql`${table.status} not in ('committed', 'signed', 'enrolled') or ${hasSchool(table.destinationSchoolId, table.destinationSchoolName)}`,
    ),
    check(
      "recruitments_transfer_origin_check",
      sql`${table.kind} <> 'transfer' or ${hasSchool(table.originSchoolId, table.originSchoolName)}`,
    ),
    // The rule that makes re-entry work: a player has at most one open
    // recruitment per sport, and can only start another once it has closed.
    uniqueIndex("recruitments_one_open_per_player_sport")
      .on(table.playerSportId)
      .where(sql`${table.closedAt} is null`),
    index("recruitments_player_sport_id_entered_at_index").on(
      table.playerSportId,
      table.enteredAt,
    ),
    index("recruitments_kind_cycle_year_status_at_index").on(
      table.kind,
      table.cycleYear,
      table.statusAt,
      table.id,
    ),
    index("recruitments_origin_enrollment_id_index").on(
      table.originEnrollmentId,
    ),
    index("recruitments_origin_school_id_index").on(table.originSchoolId),
    index("recruitments_origin_division_id_index").on(table.originDivisionId),
    index("recruitments_origin_conference_id_index").on(
      table.originConferenceId,
    ),
    index("recruitments_destination_school_id_index").on(
      table.destinationSchoolId,
    ),
    index("recruitments_destination_division_id_index").on(
      table.destinationDivisionId,
    ),
    index("recruitments_destination_conference_id_index").on(
      table.destinationConferenceId,
    ),
  ],
);

/**
 * Everything that happened in a recruitment, one row each. Append-only: a
 * mistake is voided, not deleted, so the history stays honest.
 */
export const recruitmentEventsTable = pgTable(
  "recruitment_events",
  {
    id: identityId(),
    recruitmentId: bigint("recruitment_id", { mode: "number" })
      .notNull()
      .references(() => recruitmentsTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    schoolId: text("school_id").references(() => schoolsTable.id),
    schoolName: text("school_name"),
    // Source fields are internal. They are never copied to the published tables.
    sourceType: text("source_type"),
    sourceUrl: text("source_url"),
    sourceNote: text("source_note"),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidReason: text("void_reason"),
    createdByUserId: text("created_by_user_id").references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
    ...requiredTimestamps,
  },
  (table) => [
    check(
      "recruitment_events_type_check",
      inList(table.type, RECRUITMENT_EVENT_TYPES),
    ),
    check(
      "recruitment_events_source_type_check",
      sql`${table.sourceType} is null or ${inList(table.sourceType, EVENT_SOURCE_TYPES)}`,
    ),
    check(
      "recruitment_events_school_check",
      sql`(${inList(table.type, SCHOOL_EVENT_TYPES)}) = ${hasSchool(table.schoolId, table.schoolName)}`,
    ),
    check(
      "recruitment_events_source_url_check",
      sql`${table.sourceUrl} is null or ${table.sourceUrl} ~ '^https://'`,
    ),
    index("recruitment_events_recruitment_id_occurred_at_index").on(
      table.recruitmentId,
      table.occurredAt,
      table.id,
    ),
    uniqueIndex("recruitment_events_one_live_entered")
      .on(table.recruitmentId)
      .where(sql`${table.type} = 'entered' and ${table.voidedAt} is null`),
    uniqueIndex("recruitment_events_one_live_offer_per_school")
      .on(table.recruitmentId, table.schoolId)
      .where(
        sql`${table.type} = 'offered' and ${table.voidedAt} is null and ${table.schoolId} is not null`,
      ),
    uniqueIndex("recruitment_events_one_live_offer_per_school_name")
      .on(table.recruitmentId, sql`lower(${table.schoolName})`)
      .where(
        sql`${table.type} = 'offered' and ${table.voidedAt} is null and ${table.schoolId} is null`,
      ),
    index("recruitment_events_school_id_index").on(table.schoolId),
    index("recruitment_events_created_by_user_id_index").on(
      table.createdByUserId,
    ),
  ],
);

/** Pairs an admin has ruled are different people, so the duplicate queue stops offering them. */
export const playerDuplicateDismissalsTable = pgTable(
  "player_duplicate_dismissals",
  {
    id: identityId(),
    playerAId: bigint("player_a_id", { mode: "number" })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    playerBId: bigint("player_b_id", { mode: "number" })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    dismissedByUserId: text("dismissed_by_user_id").references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Stored smaller id first so a pair has exactly one row.
    check(
      "player_duplicate_dismissals_order_check",
      sql`${table.playerAId} < ${table.playerBId}`,
    ),
    unique("player_duplicate_dismissals_pair_unique").on(
      table.playerAId,
      table.playerBId,
    ),
    index("player_duplicate_dismissals_player_b_id_index").on(table.playerBId),
    index("player_duplicate_dismissals_dismissed_by_user_id_index").on(
      table.dismissedByUserId,
    ),
  ],
);

/** Each "Push to site". `revalidated_at` stays null until the web caches were expired. */
export const portalPushesTable = pgTable(
  "portal_pushes",
  {
    id: identityId(),
    /** Null when the nightly job pushed. */
    actorUserId: text("actor_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    trigger: text("trigger").notNull(),
    playerCount: integer("player_count").notNull(),
    /** Cache tags this push must expire, kept so a failed expiry can be retried. */
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    committedAt: timestamp("committed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revalidatedAt: timestamp("revalidated_at", { withTimezone: true }),
    error: text("error"),
  },
  (table) => [
    check(
      "portal_pushes_trigger_check",
      inList(table.trigger, PORTAL_PUSH_TRIGGERS),
    ),
    index("portal_pushes_unrevalidated_index")
      .on(table.committedAt)
      .where(sql`${table.revalidatedAt} is null`),
    index("portal_pushes_actor_user_id_index").on(table.actorUserId),
  ],
);

/** Every change to player data. Rows with no `push_id` are what "N pending" counts. */
export const playerAuditLogTable = pgTable(
  "player_audit_log",
  {
    id: identityId(),
    playerId: bigint("player_id", { mode: "number" })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    /** Table the change was made to, e.g. "recruitment_events". */
    entity: text("entity").notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    action: text("action").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    actorUserId: text("actor_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    pushId: bigint("push_id", { mode: "number" }).references(
      () => portalPushesTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("player_audit_log_player_id_created_at_index").on(
      table.playerId,
      table.createdAt,
    ),
    index("player_audit_log_unpushed_index")
      .on(table.createdAt)
      .where(sql`${table.pushId} is null`),
    index("player_audit_log_push_id_index").on(table.pushId),
    index("player_audit_log_actor_user_id_index").on(table.actorUserId),
  ],
);

/**
 * What the public site knows about a player, written only by the push. Also
 * the id-to-slug index the proxy checks and the source of the player sitemap.
 */
export const publishedPlayersTable = pgTable(
  "published_players",
  {
    playerId: bigint("player_id", { mode: "number" })
      .primaryKey()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    indexable: boolean("indexable").notNull().default(false),
    /** Set for a merged player: the URL redirects to this one. */
    redirectToPlayerId: bigint("redirect_to_player_id", {
      mode: "number",
    }).references(() => playersTable.id, { onDelete: "cascade" }),
    /** The whole profile page: bio, career, history, offers. No source fields. */
    doc: jsonb("doc").notNull(),
    pushId: bigint("push_id", { mode: "number" }).references(
      () => portalPushesTable.id,
      { onDelete: "set null" },
    ),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("published_players_redirect_to_player_id_index").on(
      table.redirectToPlayerId,
    ),
    index("published_players_push_id_index").on(table.pushId),
  ],
);

/** The public wire: one row per move, written only by the push. Offers are not wire rows. */
export const publishedWireEventsTable = pgTable(
  "published_wire_events",
  {
    eventId: bigint("event_id", { mode: "number" })
      .primaryKey()
      .references(() => recruitmentEventsTable.id, { onDelete: "cascade" }),
    recruitmentId: bigint("recruitment_id", { mode: "number" })
      .notNull()
      .references(() => recruitmentsTable.id, { onDelete: "cascade" }),
    playerId: bigint("player_id", { mode: "number" })
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    kind: text("kind").notNull(),
    cycleYear: smallint("cycle_year").notNull(),
    type: text("type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    /** A commitment the player later dropped. Still shown, struck through. */
    superseded: boolean("superseded").notNull().default(false),
    /** The row as the site renders it. School ids, not names: those are joined live. */
    row: jsonb("row").notNull(),
    pushId: bigint("push_id", { mode: "number" }).references(
      () => portalPushesTable.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    check(
      "published_wire_events_kind_check",
      inList(table.kind, RECRUITMENT_KINDS),
    ),
    check(
      "published_wire_events_type_check",
      inList(table.type, RECRUITMENT_EVENT_TYPES),
    ),
    index("published_wire_events_wire_index").on(
      table.sportId,
      table.kind,
      table.cycleYear,
      table.occurredAt.desc().nullsFirst(),
      table.eventId.desc().nullsFirst(),
    ),
    index("published_wire_events_recruitment_id_index").on(table.recruitmentId),
    index("published_wire_events_player_id_index").on(table.playerId),
    index("published_wire_events_push_id_index").on(table.pushId),
  ],
);

/**
 * Tips from the public form. An inbox only: nothing here reaches the working
 * tables until an admin accepts it through the normal entry form.
 */
export const playerSubmissionsTable = pgTable(
  "player_submissions",
  {
    id: identityId(),
    status: text("status").notNull().default("new"),
    submitterRole: text("submitter_role").notNull(),
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email").notNull(),
    /** What they told us, as submitted. */
    payload: jsonb("payload").notNull(),
    matchedPlayerId: bigint("matched_player_id", {
      mode: "number",
    }).references(() => playersTable.id, { onDelete: "set null" }),
    reviewedByUserId: text("reviewed_by_user_id").references(
      () => usersTable.id,
      { onDelete: "set null" },
    ),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    ...requiredTimestamps,
  },
  (table) => [
    check(
      "player_submissions_status_check",
      inList(table.status, PLAYER_SUBMISSION_STATUSES),
    ),
    check(
      "player_submissions_submitter_role_check",
      inList(table.submitterRole, PLAYER_SUBMITTER_ROLES),
    ),
    index("player_submissions_status_created_at_index").on(
      table.status,
      table.createdAt,
    ),
    index("player_submissions_matched_player_id_index").on(
      table.matchedPlayerId,
    ),
    index("player_submissions_reviewed_by_user_id_index").on(
      table.reviewedByUserId,
    ),
  ],
);

export const playersTableRelations = relations(
  playersTable,
  ({ one, many }) => ({
    mergedInto: one(playersTable, {
      fields: [playersTable.mergedIntoId],
      references: [playersTable.id],
    }),
    sports: many(playerSportsTable),
    published: one(publishedPlayersTable, {
      fields: [playersTable.id],
      references: [publishedPlayersTable.playerId],
    }),
  }),
);

export const playerSportsTableRelations = relations(
  playerSportsTable,
  ({ one, many }) => ({
    player: one(playersTable, {
      fields: [playerSportsTable.playerId],
      references: [playersTable.id],
    }),
    sport: one(sportsTable, {
      fields: [playerSportsTable.sportId],
      references: [sportsTable.id],
    }),
    enrollments: many(playerEnrollmentsTable),
    recruitments: many(recruitmentsTable),
  }),
);

export const playerEnrollmentsTableRelations = relations(
  playerEnrollmentsTable,
  ({ one }) => ({
    playerSport: one(playerSportsTable, {
      fields: [playerEnrollmentsTable.playerSportId],
      references: [playerSportsTable.id],
    }),
    school: one(schoolsTable, {
      fields: [playerEnrollmentsTable.schoolId],
      references: [schoolsTable.id],
    }),
    viaRecruitment: one(recruitmentsTable, {
      fields: [playerEnrollmentsTable.viaRecruitmentId],
      references: [recruitmentsTable.id],
    }),
  }),
);

export const recruitmentsTableRelations = relations(
  recruitmentsTable,
  ({ one, many }) => ({
    playerSport: one(playerSportsTable, {
      fields: [recruitmentsTable.playerSportId],
      references: [playerSportsTable.id],
    }),
    originEnrollment: one(playerEnrollmentsTable, {
      fields: [recruitmentsTable.originEnrollmentId],
      references: [playerEnrollmentsTable.id],
    }),
    originSchool: one(schoolsTable, {
      fields: [recruitmentsTable.originSchoolId],
      references: [schoolsTable.id],
      relationName: "recruitmentOriginSchool",
    }),
    destinationSchool: one(schoolsTable, {
      fields: [recruitmentsTable.destinationSchoolId],
      references: [schoolsTable.id],
      relationName: "recruitmentDestinationSchool",
    }),
    events: many(recruitmentEventsTable),
  }),
);

export const recruitmentEventsTableRelations = relations(
  recruitmentEventsTable,
  ({ one }) => ({
    recruitment: one(recruitmentsTable, {
      fields: [recruitmentEventsTable.recruitmentId],
      references: [recruitmentsTable.id],
    }),
    school: one(schoolsTable, {
      fields: [recruitmentEventsTable.schoolId],
      references: [schoolsTable.id],
    }),
  }),
);

export const playerAuditLogTableRelations = relations(
  playerAuditLogTable,
  ({ one }) => ({
    player: one(playersTable, {
      fields: [playerAuditLogTable.playerId],
      references: [playersTable.id],
    }),
    push: one(portalPushesTable, {
      fields: [playerAuditLogTable.pushId],
      references: [portalPushesTable.id],
    }),
  }),
);

export const publishedWireEventsTableRelations = relations(
  publishedWireEventsTable,
  ({ one }) => ({
    player: one(playersTable, {
      fields: [publishedWireEventsTable.playerId],
      references: [playersTable.id],
    }),
    recruitment: one(recruitmentsTable, {
      fields: [publishedWireEventsTable.recruitmentId],
      references: [recruitmentsTable.id],
    }),
  }),
);

export type SelectPlayer = typeof playersTable.$inferSelect;
export type InsertPlayer = typeof playersTable.$inferInsert;
export type SelectPlayerSport = typeof playerSportsTable.$inferSelect;
export type SelectPlayerEnrollment = typeof playerEnrollmentsTable.$inferSelect;
export type SelectRecruitment = typeof recruitmentsTable.$inferSelect;
export type SelectRecruitmentEvent = typeof recruitmentEventsTable.$inferSelect;
export type InsertRecruitmentEvent = typeof recruitmentEventsTable.$inferInsert;
export type SelectPortalPush = typeof portalPushesTable.$inferSelect;
export type SelectPlayerSubmission = typeof playerSubmissionsTable.$inferSelect;
