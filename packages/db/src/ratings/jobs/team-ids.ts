import {
  fetchCurrentSeasonYear,
  fetchEspnTeam as fetchProviderTeam,
  fetchSeasonTeamIds,
  fetchTeamList,
  type EspnTeam as ProviderTeam,
} from "@redshirt-sports/clients/scores";
import { count, eq } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import {
  EXTERNAL_ID_PROVIDERS,
  schoolConferenceAffiliationsTable,
  schoolExternalIdsTable,
  schoolsTable,
  sportsTable,
} from "../../schema";
import {
  type CatalogTeam,
  type MappingPlan,
  type MappingSuggestion,
  type PlannedMapping,
  planTeamIdMapping,
  type ReviewReason,
} from "./school-mapping";

/** The provider whose team ids this module maps (the first external id provider). */
const PROVIDER = EXTERNAL_ID_PROVIDERS[0];

/** The provider uses one team id per school across these leagues (in Division I). */
export const CATALOG_LEAGUES = [
  "football/college-football",
  "basketball/mens-college-basketball",
  "basketball/womens-college-basketball",
] as const;

function toCatalogTeam(team: ProviderTeam, leagues: string[]): CatalogTeam {
  return {
    leagues,
    externalId: team.espnId,
    displayName: team.displayName,
    location: team.location,
    mascot: team.mascot,
    abbreviation: team.abbreviation,
  };
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await run(items[index] as T);
      }
    }),
  );
  return results;
}

/**
 * The provider's college teams, deduplicated by id. The team lists (three requests) cover
 * every football division and Division I basketball. `full` also walks each league's
 * current and previous season, where lower-division basketball teams live, and
 * fetches the names of teams the lists missed: about a thousand more requests.
 */
export async function loadTeamCatalog(
  options: {
    full?: boolean;
    concurrency?: number;
    log?: (line: string) => void;
  } = {},
): Promise<CatalogTeam[]> {
  const log = options.log ?? (() => {});
  const teams = new Map<string, CatalogTeam>();
  const leagues = new Map<string, Set<string>>();
  const seen = (id: string, league: string) => {
    const set = leagues.get(id) ?? new Set<string>();
    set.add(league);
    leagues.set(id, set);
  };
  const finish = () =>
    [...teams.values()].map((team) => ({
      ...team,
      leagues: [...(leagues.get(team.externalId) ?? [])],
    }));
  for (const league of CATALOG_LEAGUES) {
    const list = await fetchTeamList({ league });
    for (const team of list) {
      seen(team.espnId, league);
      // First league wins: football's "Bulldogs" over women's basketball's "Lady Bulldogs".
      if (!teams.has(team.espnId))
        teams.set(team.espnId, toCatalogTeam(team, []));
    }
    log(`${league}: ${list.length} teams in the team list.`);
  }
  if (!options.full) return finish();

  const missing = new Map<string, string>();
  for (const league of CATALOG_LEAGUES) {
    const current = await fetchCurrentSeasonYear({ league });
    for (const seasonYear of [current, current - 1]) {
      const ids = await fetchSeasonTeamIds({ league, seasonYear });
      for (const id of ids) {
        seen(id, league);
        if (!teams.has(id) && !missing.has(id)) missing.set(id, league);
      }
      log(`${league} ${seasonYear}: ${ids.length} team ids.`);
    }
  }
  log(`Fetching names for ${missing.size} teams outside the team lists.`);
  let failed = 0;
  await mapLimit(
    [...missing],
    options.concurrency ?? 8,
    async ([externalId, league]) => {
      const team = await fetchProviderTeam({
        espnLeague: league,
        espnId: externalId,
      }).catch(() => null);
      if (team) teams.set(externalId, toCatalogTeam(team, []));
      else failed += 1;
    },
  );
  if (failed > 0) log(`${failed} team(s) could not be fetched; skipped.`);
  return finish();
}

async function loadMappingState() {
  const [schools, mapped] = await Promise.all([
    db
      .select({
        id: schoolsTable.id,
        name: schoolsTable.name,
        shortName: schoolsTable.shortName,
        nickname: schoolsTable.nickname,
        abbreviation: schoolsTable.abbreviation,
      })
      .from(schoolsTable),
    db
      .select({
        schoolId: schoolExternalIdsTable.schoolId,
        externalId: schoolExternalIdsTable.externalId,
      })
      .from(schoolExternalIdsTable)
      .where(eq(schoolExternalIdsTable.provider, PROVIDER)),
  ]);
  return {
    schools,
    mappedSchools: new Set(mapped.map((row) => row.schoolId)),
    mappedTeams: new Set(mapped.map((row) => row.externalId)),
  };
}

/** Match every school without a provider team id against the catalog. Writes nothing. */
export async function planUnmappedSchools(
  catalog: CatalogTeam[],
): Promise<MappingPlan & { schools: number; mappedBefore: number }> {
  const state = await loadMappingState();
  const plan = planTeamIdMapping({
    teams: catalog,
    takenTeamIds: state.mappedTeams,
    schools: state.schools.filter(
      (school) => !state.mappedSchools.has(school.id),
    ),
  });
  return {
    ...plan,
    schools: state.schools.length,
    mappedBefore: state.mappedSchools.size,
  };
}

/**
 * Save planned mappings. Never overwrites: a school or team id mapped since the
 * plan was made is skipped by the unique constraints and reported back.
 */
export async function applyTeamIdMappings(
  mappings: PlannedMapping[],
): Promise<{ inserted: PlannedMapping[]; skipped: PlannedMapping[] }> {
  if (mappings.length === 0) return { inserted: [], skipped: [] };
  const rows = await db
    .insert(schoolExternalIdsTable)
    .values(
      mappings.map((mapping) => ({
        provider: PROVIDER,
        externalId: mapping.externalId,
        schoolId: mapping.schoolId,
      })),
    )
    .onConflictDoNothing()
    .returning({ schoolId: schoolExternalIdsTable.schoolId });
  const saved = new Set(rows.map((row) => row.schoolId));
  return {
    inserted: mappings.filter((mapping) => saved.has(mapping.schoolId)),
    skipped: mappings.filter((mapping) => !saved.has(mapping.schoolId)),
  };
}

export type TeamIdCoverage = { schools: number; mapped: number };

export async function teamIdCoverage(): Promise<TeamIdCoverage> {
  const [[schools], [mapped]] = await Promise.all([
    db.select({ value: count() }).from(schoolsTable),
    db
      .select({ value: count() })
      .from(schoolExternalIdsTable)
      .where(eq(schoolExternalIdsTable.provider, PROVIDER)),
  ]);
  return { schools: schools?.value ?? 0, mapped: mapped?.value ?? 0 };
}

export type UnmappedSchool = {
  id: string;
  name: string;
  fullName: string | null;
  nickname: string | null;
  sports: string[];
  /** "confident" would be auto-accepted by the bulk matcher. */
  reason: ReviewReason | "confident";
  suggestions: MappingSuggestion[];
};

/** Schools with no provider team id, each with suggested teams, for the admin review view. */
export async function unmappedSchools(
  catalog: CatalogTeam[],
): Promise<{ coverage: TeamIdCoverage; schools: UnmappedSchool[] }> {
  const [plan, affiliations] = await Promise.all([
    planUnmappedSchools(catalog),
    db
      .selectDistinct({
        schoolId: schoolConferenceAffiliationsTable.schoolId,
        sport: sportsTable.name,
      })
      .from(schoolConferenceAffiliationsTable)
      .innerJoin(
        sportsTable,
        eq(sportsTable.id, schoolConferenceAffiliationsTable.sportId),
      ),
  ]);
  const sports = new Map<string, string[]>();
  for (const row of affiliations) {
    if (!row.sport) continue;
    sports.set(row.schoolId, [...(sports.get(row.schoolId) ?? []), row.sport]);
  }
  const details = new Map(
    (
      await db
        .select({
          id: schoolsTable.id,
          name: schoolsTable.name,
          nickname: schoolsTable.nickname,
        })
        .from(schoolsTable)
    ).map((row) => [row.id, row]),
  );
  // Confident matches are listed too (first suggestion), so one click confirms them.
  const accepted = new Map(
    plan.accepted.map((mapping) => [mapping.schoolId, mapping]),
  );
  const items: UnmappedSchool[] = [
    ...plan.accepted.map((mapping) => ({
      schoolId: mapping.schoolId,
      schoolName: mapping.schoolName,
      reason: "confident" as const,
      suggestions: [
        {
          externalId: mapping.externalId,
          teamName: mapping.teamName,
          score: mapping.score,
          alternateIds: mapping.alternateIds,
        },
      ],
    })),
    ...plan.review,
  ]
    .map((item) => ({
      id: item.schoolId,
      name: item.schoolName,
      fullName: details.get(item.schoolId)?.name ?? null,
      nickname: details.get(item.schoolId)?.nickname ?? null,
      sports: (sports.get(item.schoolId) ?? []).sort(),
      reason: item.reason,
      suggestions: item.suggestions,
    }))
    .sort(
      (a, b) =>
        Number(accepted.has(b.id)) - Number(accepted.has(a.id)) ||
        b.sports.length - a.sports.length ||
        a.name.localeCompare(b.name),
    );
  return { coverage: await teamIdCoverage(), schools: items };
}

/** Look up a team id an admin typed, to show its name before saving. */
export async function previewTeam(
  externalId: string,
): Promise<CatalogTeam | null> {
  if (!/^\d+$/.test(externalId)) return null;
  for (const league of CATALOG_LEAGUES) {
    const team = await fetchProviderTeam({
      espnLeague: league,
      espnId: externalId,
    }).catch(() => null);
    if (team) return toCatalogTeam(team, [league]);
  }
  return null;
}
