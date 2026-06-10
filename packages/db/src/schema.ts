import { sql, relations } from "drizzle-orm";
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
  index,
  char,
  date,
} from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";

import { createPublicId } from "./utils/create-public-id";

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

export const sportsTable = pgTable("sports", {
  id: text("id").primaryKey(), // Sanity _id
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  displayName: varchar("display_name", { length: 256 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sportsTableRelations = relations(sportsTable, ({ many }) => ({
  seasons: many(seasonsTable),
  conferenceSports: many(conferenceSportsTable),
  schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
  divisionSports: many(divisionSportsTable),
  voterBallots: many(voterBallots),
  weeklyFinalRankings: many(weeklyFinalRankings),
  playerSportProfiles: many(playerSportProfilesTable),
  playerCollegeAffiliations: many(playerCollegeAffiliationsTable),
  transferPortalCycles: many(transferPortalCyclesTable),
}));

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

export const voterBallotsRelations = relations(voterBallots, ({ one }) => ({
  sport: one(sportsTable, {
    fields: [voterBallots.sportId],
    references: [sportsTable.id],
  }),
}));

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

export const weeklyFinalRankingsRelations = relations(
  weeklyFinalRankings,
  ({ one }) => ({
    sport: one(sportsTable, {
      fields: [weeklyFinalRankings.sportId],
      references: [sportsTable.id],
    }),
  }),
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

export const weeksTableRelations = relations(weeksTable, ({ one, many }) => ({
  seasonType: one(seasonTypesTable, {
    fields: [weeksTable.seasonTypeId],
    references: [seasonTypesTable.id],
  }),
}));

export const schoolsTable = pgTable(
  "schools",
  {
    ...defaultColumns,
    name: text("name"),
    sanityId: text("sanity_id"),
    shortName: text("short_name"),
    abbreviation: text(),
    nickname: text(),
    image: jsonb(),
    top25Eligible: boolean("top_25_eligible"),
  },
  (table) => [unique().on(table.sanityId), index().on(table.sanityId)],
);

export const schoolsTableRelations = relations(schoolsTable, ({ many }) => ({
  schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
  playerCollegeAffiliations: many(playerCollegeAffiliationsTable),
  transferPortalEntriesFrom: many(transferPortalEntriesTable, {
    relationName: "fromSchool",
  }),
  transferPortalEntriesCommitted: many(transferPortalEntriesTable, {
    relationName: "committedSchool",
  }),
}));

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

export const conferencesTableRelations = relations(
  conferencesTable,
  ({ many }) => ({
    conferenceSports: many(conferenceSportsTable),
    schoolConferenceAffiliations: many(schoolConferenceAffiliationsTable),
  }),
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
    parentDivisionId: text("parent_division_id"), // if this is not null, it is a subdivision
    isSubdivision: text("is_subdivision"), // if this is not null, it is a subdivision
  },
  (table) => [unique().on(table.sanityId), index().on(table.sanityId)],
);

export const divisionsTableRelations = relations(
  divisionsTable,
  ({ many }) => ({
    divisionSports: many(divisionSportsTable),
  }),
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

export const subdivisionSportsTableRelations = relations(
  divisionSportsTable,
  ({ one }) => ({
    sport: one(sportsTable, {
      fields: [divisionSportsTable.sportId],
      references: [sportsTable.id],
    }),
    division: one(divisionsTable, {
      fields: [divisionSportsTable.divisionId],
      references: [divisionsTable.id],
    }),
  }),
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

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertSeason = typeof seasonsTable.$inferInsert;
export type InsertSeasonType = typeof seasonTypesTable.$inferInsert;
export type InsertWeeks = typeof weeksTable.$inferInsert;
export type InsertSchoolConferenceAffiliations =
  typeof schoolConferenceAffiliationsTable.$inferInsert;
export type InsertConferenceSports = typeof conferenceSportsTable.$inferInsert;
export type InsertDivisionSports = typeof divisionSportsTable.$inferInsert;

export const SEASON_TYPE_CODES = {
  PRESEASON: 1,
  REGULAR_SEASON: 2,
  POSTSEASON: 3,
  OFF_SEASON: 4,
} as const;

export type SelectWeeklyRankings = typeof weeklyRankings.$inferSelect;
export type SelectSchool = typeof schoolsTable.$inferSelect;

export const TRANSFER_PORTAL_STATUS = {
  ENTERED: "entered",
  COMMITTED: "committed",
  SIGNED: "signed",
  ENROLLED: "enrolled",
  WITHDRAWN: "withdrawn",
} as const;

export type TransferPortalStatus =
  (typeof TRANSFER_PORTAL_STATUS)[keyof typeof TRANSFER_PORTAL_STATUS];

export const CLASS_STANDING = {
  FRESHMAN: "freshman",
  REDSHIRT_FRESHMAN: "redshirt_freshman",
  SOPHOMORE: "sophomore",
  REDSHIRT_SOPHOMORE: "redshirt_sophomore",
  JUNIOR: "junior",
  REDSHIRT_JUNIOR: "redshirt_junior",
  SENIOR: "senior",
  REDSHIRT_SENIOR: "redshirt_senior",
} as const;

export type ClassStanding = (typeof CLASS_STANDING)[keyof typeof CLASS_STANDING];

export const highSchoolsTable = pgTable(
  "high_schools",
  {
    ...defaultColumns,
    name: text("name").notNull(),
    city: text("city"),
    state: varchar("state", { length: 2 }),
    countryCode: char("country_code", { length: 2 }).notNull().default("US"),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
  },
  (table) => [
    index().on(table.name),
    index().on(table.state, table.countryCode),
  ],
);

export const highSchoolsTableRelations = relations(
  highSchoolsTable,
  ({ many }) => ({
    players: many(playersTable),
  }),
);

export const playersTable = pgTable(
  "players",
  {
    ...defaultColumns,
    publicId: text("public_id")
      .notNull()
      .unique()
      .$defaultFn(() => createPublicId()),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    displayName: text("display_name"),
    dateOfBirth: date("date_of_birth"),
    hometownCity: text("hometown_city"),
    hometownState: varchar("hometown_state", { length: 2 }),
    hometownCountryCode: char("hometown_country_code", { length: 2 })
      .notNull()
      .default("US"),
    highSchoolId: text("high_school_id").references(() => highSchoolsTable.id),
    highSchoolNameOverride: text("high_school_name_override"),
    height: integer("height"),
    weight: integer("weight"),
    headshotBucket: text("headshot_bucket").default("player-headshots"),
    headshotPath: text("headshot_path"),
    bio: text("bio"),
    socialLinks: jsonb("social_links"),
  },
  (table) => [
    index().on(table.publicId),
    index().on(table.highSchoolId),
    index("players_headshot_path_idx")
      .on(table.headshotPath)
      .where(sql`${table.headshotPath} IS NOT NULL`),
  ],
);

export const playersTableRelations = relations(playersTable, ({ one, many }) => ({
  highSchool: one(highSchoolsTable, {
    fields: [playersTable.highSchoolId],
    references: [highSchoolsTable.id],
  }),
  sportProfiles: many(playerSportProfilesTable),
  collegeAffiliations: many(playerCollegeAffiliationsTable),
  transferPortalEntries: many(transferPortalEntriesTable),
}));

export const playerSportProfilesTable = pgTable(
  "player_sport_profiles",
  {
    ...defaultColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    primaryPosition: varchar("primary_position", { length: 50 }),
    classStanding: varchar("class_standing", { length: 32 }),
    isGraduateTransfer: boolean("is_graduate_transfer").default(false),
    jerseyNumber: varchar("jersey_number", { length: 10 }),
  },
  (table) => [
    unique().on(table.playerId, table.sportId),
    index().on(table.playerId),
    index().on(table.sportId),
    index().on(table.primaryPosition),
  ],
);

export const playerSportProfilesTableRelations = relations(
  playerSportProfilesTable,
  ({ one }) => ({
    player: one(playersTable, {
      fields: [playerSportProfilesTable.playerId],
      references: [playersTable.id],
    }),
    sport: one(sportsTable, {
      fields: [playerSportProfilesTable.sportId],
      references: [sportsTable.id],
    }),
  }),
);

export const playerCollegeAffiliationsTable = pgTable(
  "player_college_affiliations",
  {
    ...defaultColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    schoolId: text("school_id")
      .notNull()
      .references(() => schoolsTable.id),
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year"),
    isTransfer: boolean("is_transfer").default(false),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index().on(table.playerId),
    index().on(table.schoolId, table.sportId),
    index("player_college_affiliations_current_idx")
      .on(table.playerId)
      .where(sql`${table.endYear} IS NULL`),
  ],
);

export const playerCollegeAffiliationsTableRelations = relations(
  playerCollegeAffiliationsTable,
  ({ one }) => ({
    player: one(playersTable, {
      fields: [playerCollegeAffiliationsTable.playerId],
      references: [playersTable.id],
    }),
    school: one(schoolsTable, {
      fields: [playerCollegeAffiliationsTable.schoolId],
      references: [schoolsTable.id],
    }),
    sport: one(sportsTable, {
      fields: [playerCollegeAffiliationsTable.sportId],
      references: [sportsTable.id],
    }),
  }),
);

export const transferPortalCyclesTable = pgTable(
  "transfer_portal_cycles",
  {
    ...defaultColumns,
    sportId: text("sport_id")
      .notNull()
      .references(() => sportsTable.id),
    portalYear: integer("portal_year").notNull(),
    name: text("name").notNull(),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
  },
  (table) => [
    unique().on(table.sportId, table.portalYear),
    index().on(table.sportId),
  ],
);

export const transferPortalCyclesTableRelations = relations(
  transferPortalCyclesTable,
  ({ one, many }) => ({
    sport: one(sportsTable, {
      fields: [transferPortalCyclesTable.sportId],
      references: [sportsTable.id],
    }),
    entries: many(transferPortalEntriesTable),
  }),
);

export const transferPortalEntriesTable = pgTable(
  "transfer_portal_entries",
  {
    ...defaultColumns,
    playerId: text("player_id")
      .notNull()
      .references(() => playersTable.id, { onDelete: "cascade" }),
    cycleId: text("cycle_id")
      .notNull()
      .references(() => transferPortalCyclesTable.id, { onDelete: "cascade" }),
    sequenceInCycle: integer("sequence_in_cycle").notNull().default(1),
    fromSchoolId: text("from_school_id")
      .notNull()
      .references(() => schoolsTable.id),
    status: varchar("status", { length: 32 }).notNull(),
    statusDate: timestamp("status_date", { withTimezone: true }).notNull(),
    enteredAt: timestamp("entered_at", { withTimezone: true }).notNull(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    committedSchoolId: text("committed_school_id").references(
      () => schoolsTable.id,
    ),
    committedAt: timestamp("committed_at", { withTimezone: true }),
    lastDecommittedAt: timestamp("last_decommitted_at", { withTimezone: true }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }),
    exitedAt: timestamp("exited_at", { withTimezone: true }),
    isGraduateTransfer: boolean("is_graduate_transfer").default(false),
    enteredSanityPostId: text("entered_sanity_post_id"),
    committedSanityPostId: text("committed_sanity_post_id"),
  },
  (table) => [
    unique().on(table.playerId, table.cycleId, table.sequenceInCycle),
    index().on(table.playerId),
    index().on(table.cycleId),
    index().on(table.fromSchoolId),
    index().on(table.committedSchoolId),
    index().on(table.cycleId, table.statusDate),
    index("transfer_portal_entries_active_idx")
      .on(table.cycleId, table.status)
      .where(sql`${table.status} = 'entered'`),
  ],
);

export const transferPortalEntriesTableRelations = relations(
  transferPortalEntriesTable,
  ({ one }) => ({
    player: one(playersTable, {
      fields: [transferPortalEntriesTable.playerId],
      references: [playersTable.id],
    }),
    cycle: one(transferPortalCyclesTable, {
      fields: [transferPortalEntriesTable.cycleId],
      references: [transferPortalCyclesTable.id],
    }),
    fromSchool: one(schoolsTable, {
      fields: [transferPortalEntriesTable.fromSchoolId],
      references: [schoolsTable.id],
      relationName: "fromSchool",
    }),
    committedSchool: one(schoolsTable, {
      fields: [transferPortalEntriesTable.committedSchoolId],
      references: [schoolsTable.id],
      relationName: "committedSchool",
    }),
  }),
);

export type SelectPlayer = typeof playersTable.$inferSelect;
export type InsertPlayer = typeof playersTable.$inferInsert;
export type SelectHighSchool = typeof highSchoolsTable.$inferSelect;
export type InsertHighSchool = typeof highSchoolsTable.$inferInsert;
export type SelectPlayerSportProfile =
  typeof playerSportProfilesTable.$inferSelect;
export type SelectTransferPortalEntry =
  typeof transferPortalEntriesTable.$inferSelect;
export type SelectTransferPortalCycle =
  typeof transferPortalCyclesTable.$inferSelect;
