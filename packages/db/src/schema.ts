import { randomUUID } from "node:crypto";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

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
 * Football subdivision for a playoff bracket (FCS, FBS). Basketball has no row:
 * one NCAA tournament covers every poll slice.
 */
export const bracketDivisionsTable = pgTable(
  "bracket_divisions",
  {
    ...defaultColumns,
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
  },
  (table) => [
    unique("bracket_divisions_sport_id_slug_unique").on(
      table.sportId,
      table.slug,
    ),
  ],
);

/** Versioned bracket tree. `spec` is the empty skeleton, not a seeded field. */
export const bracketFormatsTable = pgTable(
  "bracket_formats",
  {
    ...defaultColumns,
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    divisionId: text("division_id").references(() => bracketDivisionsTable.id),
    key: text("key").notNull().unique(),
    effectiveFromYear: integer("effective_from_year").notNull(),
    /** Inclusive. Null means the format is still current. */
    effectiveToYear: integer("effective_to_year"),
    spec: jsonb("spec").notNull(),
  },
  (table) => [
    index("bracket_formats_sport_id_index").on(table.sportId),
    index("bracket_formats_division_id_index").on(table.divisionId),
  ],
);

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
    status: text("status").notNull(),
    sourceWeekId: text("source_week_id")
      .notNull()
      .references(() => weeksTable.id),
    revision: integer("revision").notNull(),
    clonedFromEditionId: text("cloned_from_edition_id"),
    articleUrl: text("article_url"),
    publicNote: text("public_note"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedByUserId: text("published_by_user_id").references(
      () => usersTable.id,
      {
        onDelete: "set null",
      },
    ),
  },
  (table) => [
    check(
      "bracket_editions_kind_check",
      sql`${table.kind} in ('projection', 'official')`,
    ),
    check(
      "bracket_editions_status_check",
      sql`${table.status} in ('draft', 'published', 'superseded')`,
    ),
    check(
      "bracket_editions_article_url_check",
      sql`${table.articleUrl} is null or ${table.articleUrl} ~ '^https?://'`,
    ),
    uniqueIndex("bracket_editions_projection_identity")
      .on(table.formatId, table.seasonId, table.sourceWeekId, table.revision)
      .where(sql`${table.kind} = 'projection'`),
    uniqueIndex("bracket_editions_official_draft")
      .on(table.formatId, table.seasonId)
      .where(sql`${table.kind} = 'official' and ${table.status} = 'draft'`),
    uniqueIndex("bracket_editions_official_published")
      .on(table.formatId, table.seasonId)
      .where(sql`${table.kind} = 'official' and ${table.status} = 'published'`),
    foreignKey({
      columns: [table.clonedFromEditionId],
      foreignColumns: [table.id],
      name: "bracket_editions_cloned_from_edition_id_fk",
    }).onDelete("set null"),
    index("bracket_editions_season_id_index").on(table.seasonId),
    index("bracket_editions_source_week_id_index").on(table.sourceWeekId),
    index("bracket_editions_published_by_user_id_index").on(
      table.publishedByUserId,
    ),
    index("bracket_editions_cloned_from_edition_id_index").on(
      table.clonedFromEditionId,
    ),
  ],
);

export const bracketSlotsTable = pgTable(
  "bracket_slots",
  {
    ...defaultColumns,
    editionId: text("edition_id")
      .notNull()
      .references(() => bracketEditionsTable.id, { onDelete: "cascade" }),
    slotKey: text("slot_key").notNull(),
    seed: integer("seed"),
    region: text("region"),
    showSeed: boolean("show_seed").notNull(),
    schoolId: text("school_id").references(() => schoolsTable.id),
    bidType: text("bid_type"),
    bidLabel: text("bid_label"),
  },
  (table) => [
    unique("bracket_slots_edition_id_slot_key_unique").on(
      table.editionId,
      table.slotKey,
    ),
    uniqueIndex("bracket_slots_edition_school")
      .on(table.editionId, table.schoolId)
      .where(sql`${table.schoolId} is not null`),
    check(
      "bracket_slots_bid_type_check",
      sql`${table.bidType} is null or ${table.bidType} in ('auto', 'at-large')`,
    ),
    index("bracket_slots_school_id_index").on(table.schoolId),
  ],
);

export const bracketGamesTable = pgTable(
  "bracket_games",
  {
    ...defaultColumns,
    editionId: text("edition_id")
      .notNull()
      .references(() => bracketEditionsTable.id, { onDelete: "cascade" }),
    gameKey: text("game_key").notNull(),
    roundKey: text("round_key").notNull(),
    roundLabel: text("round_label").notNull(),
    sideASlotKey: text("side_a_slot_key"),
    sideBSlotKey: text("side_b_slot_key"),
    sideAFromGameKey: text("side_a_from_game_key"),
    sideBFromGameKey: text("side_b_from_game_key"),
    homeSide: text("home_side"),
    siteLabel: text("site_label"),
    status: text("status").notNull().default("scheduled"),
    winnerSchoolId: text("winner_school_id").references(() => schoolsTable.id),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
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
      "bracket_games_status_check",
      sql`${table.status} in ('scheduled', 'final')`,
    ),
    index("bracket_games_winner_school_id_index").on(table.winnerSchoolId),
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

export const bracketDivisionsTableRelations = relations(
  bracketDivisionsTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [bracketDivisionsTable.sportId],
      references: [sportsTable.id],
    }),
    formats: many(bracketFormatsTable),
  }),
);

export const bracketFormatsTableRelations = relations(
  bracketFormatsTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [bracketFormatsTable.sportId],
      references: [sportsTable.id],
    }),
    division: one(bracketDivisionsTable, {
      fields: [bracketFormatsTable.divisionId],
      references: [bracketDivisionsTable.id],
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
    sourceWeek: one(weeksTable, {
      fields: [bracketEditionsTable.sourceWeekId],
      references: [weeksTable.id],
    }),
    publishedBy: one(usersTable, {
      fields: [bracketEditionsTable.publishedByUserId],
      references: [usersTable.id],
    }),
    clonedFrom: one(bracketEditionsTable, {
      fields: [bracketEditionsTable.clonedFromEditionId],
      references: [bracketEditionsTable.id],
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
    winner: one(schoolsTable, {
      fields: [bracketGamesTable.winnerSchoolId],
      references: [schoolsTable.id],
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
