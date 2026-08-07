"use server";

import {
  fetchWeeksFromSportsUrl,
  getMultipleSeasonsData,
  type SportParam,
} from "@redshirt-sports/clients/espn";
import { primaryDb as db } from "@redshirt-sports/db/client";
import {
  conferenceSportsTable,
  conferencesTable,
  divisionSportsTable,
  divisionsTable,
  type InsertConferenceSports,
  type InsertDivisionSports,
  type InsertSeason,
  type InsertSeasonType,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from "@redshirt-sports/db/schema";
import { client } from "@redshirt-sports/sanity/client";
import {
  conferencesQuery,
  divisionsQuery,
  schoolsQuery,
  sportInfoQuery,
  subdivisionsQuery,
} from "@redshirt-sports/sanity/queries";
import type {
  ConferencesQueryResult,
  DivisionsQueryResult,
  SchoolsQueryResult,
  SportInfoQueryResult,
  SubdivisionsQueryResult,
} from "@redshirt-sports/sanity/types";
import { inArray, sql } from "drizzle-orm";

import { requireAdmin } from "@/lib/require-admin";

/** Plain client fetch — `defineLive` sanityFetch requires `"use cache"` (cacheTag). */
const sanity = client.withConfig({
  useCdn: false,
  perspective: "published",
  stega: false,
});

export type LoaderResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function formatLoaderError(error: unknown): string {
  const cause =
    error && typeof error === "object" && "cause" in error
      ? (
          error as {
            cause?: {
              code?: string;
              constraint_name?: string;
            };
          }
        ).cause
      : undefined;

  if (cause?.code === "23505") {
    return cause.constraint_name
      ? `Already in the database (conflict on ${cause.constraint_name}).`
      : "Some of these records already exist in the database.";
  }

  if (error instanceof Error) {
    const { message } = error;
    if (
      !message.startsWith("Failed query:") &&
      message.length > 0 &&
      message.length <= 280
    ) {
      return message;
    }
  }

  return "Loader failed. Check the admin server logs for details.";
}

async function runLoader(
  name: string,
  fn: () => Promise<string>,
): Promise<LoaderResult> {
  try {
    const message = await fn();
    return { ok: true, message };
  } catch (error) {
    console.error(`[data-loader:${name}]`, error);
    return { ok: false, error: formatLoaderError(error) };
  }
}

export async function fetchAndLoadAllSeasons() {
  return runLoader("seasons", async () => {
    await requireAdmin();

    await Promise.all(
      ["football", "mens-basketball", "womens-basketball"].map((sport) =>
        fetchAndLoadSeasons(sport as SportParam, 2023),
      ),
    );

    return "Loaded seasons, season types, and weeks.";
  });
}

export async function fetchAndLoadSeasons(
  sport: SportParam,
  startingSeason = new Date().getFullYear() - 3,
) {
  await requireAdmin();

  const espnSeasons = await getMultipleSeasonsData(sport, startingSeason);

  const dbSport = await sportBySlug(sport);

  for (const season of espnSeasons) {
    const newSeason = {
      year: season.year,
      displayName: season.displayName,
      startDate: new Date(season.startDate),
      endDate: new Date(season.endDate),
      sportId: dbSport.id,
    };

    const dbSeason = await findOrCreateSeason(newSeason);

    for (const seasonType of season.types) {
      const newSeasonType = {
        type: seasonType.type,
        startDate: new Date(seasonType.startDate),
        endDate: new Date(seasonType.endDate),
        seasonId: dbSeason.id,
      };

      const dbSeasonType = await findOrCreateSeasonType(newSeasonType);

      let sourceWeeks = [];
      if (seasonType.weeks) {
        sourceWeeks = seasonType.weeks;
      } else {
        sourceWeeks = await fetchWeeksFromSportsUrl(
          sport,
          dbSeason.year,
          dbSeasonType.type,
        );
      }

      const mappedWeeks = sourceWeeks.map((week) => ({
        number: week.number,
        text: week.text,
        startDate: new Date(week.startDate),
        endDate: new Date(week.endDate),
        seasonTypeId: dbSeasonType.id,
      }));

      if (mappedWeeks.length) {
        const existingWeeks = await db.query.weeksTable.findMany({
          where: (model, { eq }) => eq(model.seasonTypeId, dbSeasonType.id),
        });

        if (existingWeeks.length) {
          console.log("Existing weeks found. Skipping load of weeks.");
        } else {
          try {
            await db.insert(weeksTable).values(mappedWeeks);
          } catch {
            throw new Error("Unable to create weeks! Aborting.");
          }
        }
      }
    }
  }
}

async function findOrCreateSeasonType(seasonType: InsertSeasonType) {
  try {
    let dbSeasonType = await db.query.seasonTypesTable.findFirst({
      where: (model, { eq, and }) =>
        and(
          eq(model.type, seasonType.type),
          eq(model.seasonId, seasonType.seasonId),
        ),
    });
    if (!dbSeasonType) {
      const insertedSeasonType = await db
        .insert(seasonTypesTable)
        .values(seasonType)
        .returning();
      dbSeasonType = insertedSeasonType[0];
    }
    return dbSeasonType!;
  } catch {
    throw new Error("Unable to find or create season type! Aborting.");
  }
}

async function findOrCreateSeason(season: InsertSeason) {
  try {
    let dbSeason = await db.query.seasonsTable.findFirst({
      where: (model, { eq, and }) =>
        and(eq(model.year, season.year), eq(model.sportId, season.sportId)),
    });
    if (!dbSeason) {
      const insertedSeason = await db
        .insert(seasonsTable)
        .values(season)
        .returning();
      dbSeason = insertedSeason[0];
    }
    return dbSeason!;
  } catch {
    throw new Error("Unable to find or create season! Aborting.");
  }
}

async function sportBySlug(slug: string) {
  const dbSport = await db.query.sportsTable.findFirst({
    where: (model, { eq }) => eq(model.slug, slug),
  });

  if (!dbSport) {
    throw new Error(
      "Sport data not yet loaded. Please load sport before creating seasons.",
    );
  }

  return dbSport;
}

export async function fetchAndLoadSports() {
  return runLoader("sports", async () => {
    await requireAdmin();

    const data = await sanity.fetch(sportInfoQuery);

    const mappedSports = data.map((d: SportInfoQueryResult[number]) => ({
      id: d._id,
      slug: d.slug,
      name: d.title,
      displayName: d.title,
      createdAt: new Date(d._createdAt),
      updatedAt: new Date(d._updatedAt),
    }));

    await db
      .insert(sportsTable)
      .values(mappedSports)
      .onConflictDoUpdate({
        target: sportsTable.id,
        set: {
          slug: sql`excluded.slug`,
          name: sql`excluded.name`,
          displayName: sql`excluded.display_name`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    return `Upserted ${mappedSports.length} sports.`;
  });
}

export async function fetchAndLoadDivisions() {
  return runLoader("divisions", async () => {
    await requireAdmin();

    const data = await sanity.fetch(divisionsQuery);

    const mappedDivisions = data.map((d: DivisionsQueryResult[number]) => ({
      sanityId: d._id,
      name: d.name,
      title: d.title,
      description: d.description,
      heading: d.heading,
      longName: d.longName,
      slug: d.slug,
      logo: d.logo,
      createdAt: new Date(d._createdAt),
      updatedAt: new Date(d._updatedAt),
    }));

    await db
      .insert(divisionsTable)
      .values(mappedDivisions)
      .onConflictDoUpdate({
        target: divisionsTable.sanityId,
        set: {
          name: sql`excluded.name`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          heading: sql`excluded.heading`,
          longName: sql`excluded.long_name`,
          slug: sql`excluded.slug`,
          logo: sql`excluded.logo`,
          updatedAt: sql`excluded.updated_at`,
        },
      });

    return `Upserted ${mappedDivisions.length} divisions.`;
  });
}

export async function fetchAndLoadSchools() {
  return runLoader("schools", async () => {
    await requireAdmin();

    const sports = await db.query.sportsTable.findMany();
    if (!sports.length) {
      throw new Error(
        "No sports found. Sports must be loaded prior to schools.",
      );
    }
    const conferences = await db.query.conferencesTable.findMany();
    if (!conferences.length) {
      throw new Error(
        "No conferences found. Conferences must be loaded prior to schools.",
      );
    }

    const data = await sanity.fetch(schoolsQuery);

    const schoolConferenceAffiliations: {
      schoolSanityId: string;
      conferenceId: string;
      sportId: string;
    }[] = [];

    const mappedSchools = data.map((d: SchoolsQueryResult[number]) => {
      d.conferenceAffiliations?.forEach(
        (
          affiliation: NonNullable<
            SchoolsQueryResult[number]["conferenceAffiliations"]
          >[number],
        ) => {
          const conference = conferences.find(
            (c) => c.sanityId === affiliation.conferenceId,
          );
          if (conference) {
            schoolConferenceAffiliations.push({
              schoolSanityId: d._id,
              conferenceId: conference.id,
              sportId: affiliation.sportId,
            });
          }
        },
      );

      return {
        sanityId: d._id,
        name: d.name,
        shortName: d.shortName,
        abbreviation: d.abbreviation,
        nickname: d.nickname,
        top25Eligible: d.top25VotingEligible,
        image: d.image,
        createdAt: new Date(d._createdAt),
        updatedAt: new Date(d._updatedAt),
      };
    });

    const dbSchools = await db
      .insert(schoolsTable)
      .values(mappedSchools)
      .onConflictDoUpdate({
        target: schoolsTable.sanityId,
        set: {
          name: sql`excluded.name`,
          shortName: sql`excluded.short_name`,
          abbreviation: sql`excluded.abbreviation`,
          nickname: sql`excluded.nickname`,
          top25Eligible: sql`excluded.top_25_eligible`,
          image: sql`excluded.image`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning();

    const schoolIdBySanityId = new Map(
      dbSchools
        .filter((school) => school.sanityId)
        .map((school) => [school.sanityId as string, school.id]),
    );

    const affiliationRows = schoolConferenceAffiliations.flatMap(
      (affiliation) => {
        const schoolId = schoolIdBySanityId.get(affiliation.schoolSanityId);
        if (!schoolId) {
          return [];
        }
        return [
          {
            schoolId,
            conferenceId: affiliation.conferenceId,
            sportId: affiliation.sportId,
          },
        ];
      },
    );

    const syncedSchoolIds = dbSchools.map((school) => school.id);
    await db.transaction(async (tx) => {
      if (syncedSchoolIds.length > 0) {
        await tx
          .delete(schoolConferenceAffiliationsTable)
          .where(
            inArray(
              schoolConferenceAffiliationsTable.schoolId,
              syncedSchoolIds,
            ),
          );
      }

      if (affiliationRows.length > 0) {
        await tx
          .insert(schoolConferenceAffiliationsTable)
          .values(affiliationRows);
      }
    });

    return `Upserted ${dbSchools.length} schools and replaced ${affiliationRows.length} conference affiliations from Sanity.`;
  });
}

export async function fetchAndLoadConferences() {
  return runLoader("conferences", async () => {
    await requireAdmin();

    const sports = await db.query.sportsTable.findMany();
    if (!sports.length) {
      throw new Error(
        "No sports found. Sports must be loaded prior to conferences.",
      );
    }
    const divisions = await db.query.divisionsTable.findMany();
    if (!divisions.length) {
      throw new Error(
        "No divisions found. Divisions must be loaded prior to conferences.",
      );
    }

    const data = await sanity.fetch(conferencesQuery);
    let conferenceSportMappings: Record<string, string>[] = [];

    const mappedConferences = [];

    for (const conference of data as ConferencesQueryResult) {
      const existingConference = await db.query.conferencesTable.findFirst({
        where: (model, { eq }) => eq(model.sanityId, conference._id),
      });

      if (existingConference) {
        continue;
      }

      const divisionId = divisions.find(
        (division) => division.sanityId === conference.divisionId,
      )?.id;

      if (!divisionId) {
        throw new Error(
          `Unable to find a division for conference ${conference.name}`,
        );
      }

      if (conference?.sports?.length) {
        conference.sports.forEach((sport: string) => {
          conferenceSportMappings.push({
            sportId: sport,
            conferenceName: conference.name,
          });
        });
      }

      mappedConferences.push({
        sanityId: conference._id,
        name: conference.name,
        divisionId,
        shortName: conference.shortName,
        abbreviation: conference.abbreviation,
        slug: conference.slug,
        logo: conference.logo,
        createdAt: new Date(conference._createdAt),
        updatedAt: new Date(conference._updatedAt),
      });
    }

    if (!mappedConferences.length) {
      return "No new conferences to load.";
    }

    const dbConferences = await db
      .insert(conferencesTable)
      .values(mappedConferences)
      .returning();

    conferenceSportMappings = conferenceSportMappings.map((mapping) => {
      const conf = dbConferences.find(
        (dbc) => dbc.name === mapping.conferenceName,
      );
      return {
        sportId: mapping.sportId!,
        conferenceId: conf?.id || "",
      };
    });

    if (conferenceSportMappings.length) {
      await db
        .insert(conferenceSportsTable)
        .values(conferenceSportMappings as unknown as InsertConferenceSports)
        .onConflictDoNothing();
    }

    return `Inserted ${dbConferences.length} conferences.`;
  });
}

export async function fetchAndLoadSubdivisions() {
  return runLoader("subdivisions", async () => {
    await requireAdmin();

    const sports = await db.query.sportsTable.findMany();
    if (!sports.length) {
      throw new Error(
        "No sports found. Sports must be loaded prior to subdivisions.",
      );
    }

    const divisions = await db.query.divisionsTable.findMany();
    if (!divisions.length) {
      throw new Error(
        "No divisions found. Divisions must be loaded prior to subdivisions.",
      );
    }
    const data = await sanity.fetch(subdivisionsQuery);

    const divisionSportMappings: {
      subdivisionSanityId: string;
      sportId: string;
    }[] = [];

    const subdivisions = data.map((d: SubdivisionsQueryResult[number]) => {
      const division = divisions.find(
        (div) => div.sanityId === d.parentDivisionId,
      );
      d.applicableSports.forEach((sport: string) => {
        divisionSportMappings.push({
          subdivisionSanityId: d._id,
          sportId: sport,
        });
      });

      return {
        parentDivisionId: division?.id,
        name: d.shortName,
        longName: d.name,
        sanityId: d._id,
        slug: d.slug,
        isSubdivision: "true",
      };
    });

    const dbSubdivisions = await db
      .insert(divisionsTable)
      .values(subdivisions)
      .onConflictDoUpdate({
        target: divisionsTable.sanityId,
        set: {
          parentDivisionId: sql`excluded.parent_division_id`,
          name: sql`excluded.name`,
          longName: sql`excluded.long_name`,
          slug: sql`excluded.slug`,
          isSubdivision: sql`excluded.is_subdivision`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
      .returning();

    const subdivisionIdBySanityId = new Map(
      dbSubdivisions
        .filter((subdivision) => subdivision.sanityId)
        .map((subdivision) => [subdivision.sanityId as string, subdivision.id]),
    );

    const sportRows = divisionSportMappings.flatMap((mapping) => {
      const divisionId = subdivisionIdBySanityId.get(
        mapping.subdivisionSanityId,
      );
      if (!divisionId) {
        return [];
      }
      return [
        {
          sportId: mapping.sportId,
          divisionId,
        },
      ];
    });

    if (sportRows.length) {
      await db
        .insert(divisionSportsTable)
        .values(sportRows as unknown as InsertDivisionSports)
        .onConflictDoNothing();
    }

    return `Upserted ${dbSubdivisions.length} subdivisions.`;
  });
}
