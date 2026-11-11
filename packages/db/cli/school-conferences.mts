/**
 * pnpm school-conferences [--out plan.json] [--cache providers.json] [--apply] [--apply-changed] [--add-conference-sports]
 *
 * Fills in which conference each school plays in, per sport, from the data
 * providers, so "Schools with no conference" doesn't have to be done by hand.
 *
 *   Football, all NCAA divisions     ESPN, current season
 *   Division I basketball            ESPN, current season
 *   Division II and III basketball   NCAA scoreboards, 2024-25 (the feed's last season)
 *   NAIA, junior colleges            No source: left for review
 *
 * Teams match schools by ESPN id (Postgres school_external_ids) or, for the
 * NCAA feed, by name with the same matcher as `pnpm team-ids`. Nothing is
 * written without a flag:
 *
 *   (none)                   Print the summary; with --out, write the full plan.
 *   --apply                  Add the conference for every school and sport that has none.
 *   --apply-changed          Also replace conferences the provider lists differently
 *                            (realignment). Review the plan's "changed" list first.
 *   --add-conference-sports  Add a sport to a conference's "Sports sponsored" when
 *                            its members play it there.
 *   --create-conferences     First create the conferences providers list that Sanity
 *                            lacks (see NEW_CONFERENCES; confirm each still exists),
 *                            so their members are matched in the same run.
 *   --cache                  Reuse provider data from this file, or save it there.
 *
 * Reads Sanity from NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET and
 * writes with SANITY_API_WRITE_TOKEN; ESPN ids come from DATABASE_URL. All from
 * apps/web/.env.local.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import postgres from "postgres";

import {
  type AffiliationChange,
  dedupeAcrossDivisions,
  NEW_CONFERENCES,
  newConferenceKey,
  type ProviderMembership,
  planAffiliations,
  type SanityConference,
  type SanitySchool,
  type SportSlug,
} from "../src/school-conferences/plan";
import { hasFlag, loadCliEnv, readFlag } from "./cli-env";

loadCliEnv();
const log = (line: string) => console.log(`• ${line}`);

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (!projectId || !dataset) {
  throw new Error(
    "Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.",
  );
}
const SANITY_API = `https://${projectId}.api.sanity.io/v2025-06-11/data`;

// --- small helpers ------------------------------------------------------

async function getJson<T>(url: string, attempt = 1): Promise<T | null> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    if (attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      return getJson(url, attempt + 1);
    }
    throw new Error(`${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

/** Run `work` over `items`, at most `limit` at a time. */
async function mapLimited<T, R>(
  items: T[],
  limit: number,
  work: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await work(items[index] as T);
      }
    }),
  );
  return results;
}

const refId = (ref: string) =>
  ref.match(/\/(?:groups|teams)\/(\d+)/)?.[1] ?? "";

// --- ESPN ---------------------------------------------------------------

type EspnRef = { $ref: string };
type EspnList = { items?: EspnRef[] };
type EspnGroup = {
  id: string;
  name: string;
  shortName?: string;
  abbreviation?: string;
  isConference?: boolean;
};
type EspnTeam = {
  id: string;
  location?: string;
  name?: string;
  displayName?: string;
  abbreviation?: string;
};

const ESPN_LEAGUES: Array<{
  sport: SportSlug;
  path: string;
  /** ESPN's division groups and the division slug we use for them. */
  divisions: Array<{ group: string; division: string }>;
  /** ESPN's season year for the current season. */
  season: number;
}> = [
  {
    sport: "football",
    path: "football/leagues/college-football",
    divisions: [
      { group: "80", division: "d1" },
      { group: "81", division: "d1" },
      { group: "57", division: "d2" },
      { group: "58", division: "d3" },
    ],
    season: new Date().getUTCFullYear(),
  },
  ...(["mens-basketball", "womens-basketball"] as const).map((sport) => ({
    sport,
    path: `basketball/leagues/${sport === "mens-basketball" ? "mens" : "womens"}-college-basketball`,
    divisions: [{ group: "50", division: "d1" }],
    // Basketball seasons are named for the year they end.
    season:
      new Date().getUTCMonth() >= 7
        ? new Date().getUTCFullYear() + 1
        : new Date().getUTCFullYear(),
  })),
];

async function espnMemberships(schoolIdByEspnId: Map<string, string>) {
  const memberships: ProviderMembership[] = [];
  for (const league of ESPN_LEAGUES) {
    const base = `https://sports.core.api.espn.com/v2/sports/${league.path}/seasons/${league.season}`;
    for (const { group, division } of league.divisions) {
      const children = await getJson<EspnList>(
        `${base}/types/2/groups/${group}/children?limit=100`,
      );
      const conferenceIds = (children?.items ?? []).map((item) =>
        refId(item.$ref),
      );
      const conferences = await mapLimited(conferenceIds, 6, async (id) => {
        const [detail, teams] = await Promise.all([
          getJson<EspnGroup>(`${base}/types/2/groups/${id}?lang=en`),
          getJson<EspnList>(`${base}/types/2/groups/${id}/teams?limit=200`),
        ]);
        return {
          detail,
          teamIds: (teams?.items ?? []).map((item) => refId(item.$ref)),
        };
      });

      for (const { detail, teamIds } of conferences) {
        if (!detail) continue;
        // Names are only needed for teams Postgres doesn't map by id.
        const unknown = teamIds.filter((id) => !schoolIdByEspnId.has(id));
        const details = new Map(
          (
            await mapLimited(unknown, 6, (id) =>
              getJson<EspnTeam>(`${base}/teams/${id}?lang=en`),
            )
          )
            .filter((team): team is EspnTeam => Boolean(team))
            .map((team) => [team.id, team]),
        );
        for (const id of teamIds) {
          const team = details.get(id);
          memberships.push({
            source: "espn",
            season: String(league.season),
            sport: league.sport,
            division,
            conference: {
              name: detail.name,
              shortName: detail.shortName,
              abbreviation: detail.abbreviation,
            },
            team: {
              espnId: id,
              location: team?.location ?? null,
              displayName: team?.displayName ?? `ESPN team ${id}`,
              mascot: team?.name ?? null,
              abbreviation: team?.abbreviation ?? null,
            },
          });
        }
      }
      log(
        `ESPN ${league.sport} group ${group}: ${conferences.length} conferences`,
      );
    }
  }
  return memberships;
}

// --- NCAA scoreboards (Division II and III basketball) -------------------

type NcaaSide = {
  names?: { short?: string; full?: string; char6?: string };
  conferences?: Array<{ conferenceName?: string }>;
};
type NcaaScoreboard = {
  games?: Array<{ game: { away: NcaaSide; home: NcaaSide } }>;
};

/** Weekly dates across the 2024-25 season, when every team plays a conference game. */
function seasonDates() {
  const dates: string[] = [];
  for (
    let day = new Date("2024-11-15T12:00:00Z");
    day < new Date("2025-03-01T12:00:00Z");
  ) {
    dates.push(day.toISOString().slice(0, 10).replaceAll("-", "/"));
    day = new Date(day.getTime() + 4 * 24 * 60 * 60 * 1000);
  }
  return dates;
}

async function ncaaMemberships() {
  const memberships: ProviderMembership[] = [];
  const feeds = [
    { sport: "mens-basketball" as const, path: "basketball-men" },
    { sport: "womens-basketball" as const, path: "basketball-women" },
  ];
  for (const feed of feeds) {
    for (const division of ["d2", "d3"]) {
      // Latest conference seen for each team across the season.
      const teams = new Map<string, ProviderMembership>();
      const boards = await mapLimited(seasonDates(), 6, (date) =>
        getJson<NcaaScoreboard>(
          `https://data.ncaa.com/casablanca/scoreboard/${feed.path}/${division}/${date}/scoreboard.json`,
        ),
      );
      for (const board of boards) {
        for (const { game } of board?.games ?? []) {
          for (const side of [game.away, game.home]) {
            const full = side.names?.full;
            const conference = side.conferences?.[0]?.conferenceName;
            if (
              !full ||
              !conference ||
              /^(DI+ )?Ind(ependent)?$/i.test(conference)
            )
              continue;
            teams.set(full, {
              source: "ncaa",
              season: "2024-25",
              sport: feed.sport,
              division,
              conference: { name: conference, abbreviation: conference },
              team: {
                location: side.names?.short ?? null,
                displayName: full,
                mascot: null,
                abbreviation: side.names?.char6 ?? null,
              },
            });
          }
        }
      }
      memberships.push(...teams.values());
      log(`NCAA ${feed.sport} ${division}: ${teams.size} teams`);
    }
  }
  return memberships;
}

// --- Sanity ---------------------------------------------------------------

async function sanityQuery<T>(query: string): Promise<T> {
  const url = new URL(`${SANITY_API}/query/${dataset}`);
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "published");
  const json = (await getJson<{ result: T }>(url.toString())) as { result: T };
  return json.result;
}

async function sanityMutate(mutations: unknown[]) {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) throw new Error("Set SANITY_API_WRITE_TOKEN to apply.");
  for (let i = 0; i < mutations.length; i += 100) {
    const response = await fetch(
      `${SANITY_API}/mutate/${dataset}?visibility=async`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations: mutations.slice(i, i + 100) }),
      },
    );
    if (!response.ok)
      throw new Error(`Sanity ${response.status}: ${await response.text()}`);
  }
}

// --- run -------------------------------------------------------------------

const [sanity, schoolIdByEspnId] = await Promise.all([
  sanityQuery<{
    sports: Array<{ _id: string; slug: SportSlug }>;
    conferences: SanityConference[];
    schools: Array<{
      _id: string;
      name: string | null;
      shortName: string | null;
      nickname: string | null;
      abbreviation: string | null;
      affiliations: Array<{
        sport: SportSlug | null;
        conferenceId: string | null;
      }> | null;
    }>;
  }>(`{
    "sports": *[_type == "sport"]{_id, "slug": slug.current},
    "conferences": *[_type == "conference"]{
      _id, name, shortName, abbreviation,
      "division": coalesce(primaryClassification->slug.current, division->slug.current),
      "sports": sports[]->slug.current
    },
    "schools": *[_type == "school"]{
      _id, name, shortName, nickname, abbreviation,
      "affiliations": conferenceAffiliations[]{"sport": sport->slug.current, "conferenceId": conference._ref}
    }
  }`),
  (async () => {
    if (!process.env.DATABASE_URL) return new Map<string, string>();
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    const rows = await sql<{ external_id: string; sanity_id: string }[]>`
      select e.external_id, s.sanity_id
      from school_external_ids e join schools s on s.id = e.school_id
      where e.provider = 'espn' and s.sanity_id is not null`;
    await sql.end();
    return new Map(rows.map((row) => [row.external_id, row.sanity_id]));
  })(),
]);
log(
  `${sanity.schools.length} schools, ${sanity.conferences.length} conferences, ${schoolIdByEspnId.size} ESPN ids`,
);

const cacheFile = readFlag("--cache");
let memberships: ProviderMembership[];
if (cacheFile && existsSync(cacheFile)) {
  memberships = JSON.parse(readFileSync(cacheFile, "utf8"));
  log(`Read ${memberships.length} memberships from ${cacheFile}.`);
} else {
  memberships = [
    ...(await espnMemberships(schoolIdByEspnId)),
    ...(await ncaaMemberships()),
  ];
  if (cacheFile) writeFileSync(cacheFile, JSON.stringify(memberships));
}

const schools: SanitySchool[] = sanity.schools.map((school) => ({
  ...school,
  id: school._id,
  affiliations: (school.affiliations ?? []).filter(
    (row): row is { sport: SportSlug; conferenceId: string } =>
      Boolean(row.sport && row.conferenceId),
  ),
}));
memberships = dedupeAcrossDivisions(memberships);
const conferences = [...sanity.conferences];

// Conferences providers list that Sanity lacks, with enough members to be a
// real league rather than a cross-division opponent or two.
const firstPass = planAffiliations({
  memberships,
  schools,
  conferences,
  schoolIdByEspnId,
});
const toCreate = firstPass.unknownConferences.flatMap((unknown) => {
  const key =
    unknown.teams >= 3
      ? newConferenceKey(unknown.name, unknown.division)
      : null;
  return key ? [{ key, sports: unknown.sports }] : [];
});
if (toCreate.length > 0) {
  log(
    `${toCreate.length} conferences to create with --create-conferences: ${toCreate
      .map(({ key }) => NEW_CONFERENCES[key]?.name)
      .join(", ")}`,
  );
}

if (!hasFlag("--create-conferences") && toCreate.length > 0) {
  // Show what creating them would add, without creating anything.
  const preview = planAffiliations({
    memberships,
    schools,
    conferences: [
      ...conferences,
      ...toCreate.flatMap(({ key, sports }) => {
        const definition = NEW_CONFERENCES[key];
        return definition ? [{ _id: `new:${key}`, ...definition, sports }] : [];
      }),
    ],
    schoolIdByEspnId,
  });
  log(
    `With --create-conferences: ${preview.add.length - firstPass.add.length} more affiliations (${new Set(preview.add.map((change) => change.schoolId)).size} schools in all)`,
  );
}

if (hasFlag("--create-conferences") && toCreate.length > 0) {
  const classificationIds = await sanityQuery<
    Array<{ _id: string; slug: string }>
  >(`*[_type == "classification"]{_id, "slug": slug.current}`);
  const sportIds = new Map(
    sanity.sports.map((sport) => [sport.slug, sport._id]),
  );
  const created = toCreate.flatMap(({ key, sports }) => {
    const definition = NEW_CONFERENCES[key];
    const classification = classificationIds.find(
      (entry) => entry.slug === definition?.division,
    );
    if (!definition || !classification) return [];
    const merged = new Map<string, { sports: SportSlug[] }>();
    // Men's and women's rows for the same league arrive separately; join them.
    const existing = merged.get(key) ?? { sports: [] };
    merged.set(key, { sports: [...new Set([...existing.sports, ...sports])] });
    return [
      {
        _id: randomUUID(),
        _type: "conference",
        name: definition.name,
        shortName: definition.shortName,
        abbreviation: definition.abbreviation,
        slug: {
          _type: "slug",
          current: definition.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        },
        primaryClassification: { _type: "reference", _ref: classification._id },
        sports: sports.map((sport) => ({
          _type: "reference",
          _ref: sportIds.get(sport) as string,
          _key: randomUUID().slice(0, 12),
        })),
      },
    ];
  });
  await sanityMutate(created.map((doc) => ({ create: doc })));
  for (const doc of created) {
    conferences.push({
      _id: doc._id,
      name: doc.name,
      shortName: doc.shortName,
      abbreviation: doc.abbreviation,
      division:
        NEW_CONFERENCES[
          toCreate.find(
            (entry) => NEW_CONFERENCES[entry.key]?.name === doc.name,
          )?.key ?? ""
        ]?.division ?? null,
      sports:
        toCreate.find((entry) => NEW_CONFERENCES[entry.key]?.name === doc.name)
          ?.sports ?? [],
    });
  }
  log(`Created ${created.length} conferences.`);
}

const plan = planAffiliations({
  memberships,
  schools,
  conferences,
  schoolIdByEspnId,
});

const schoolsWithout = schools.filter(
  (school) => school.affiliations.length === 0,
).length;
const schoolsFilled = new Set(plan.add.map((change) => change.schoolId)).size;
log(
  `${plan.add.length} conferences to add (${schoolsFilled} schools; ${schoolsWithout} have none today)`,
);
log(
  `${plan.changed.length} differ from Sanity (realignment or errors; --apply-changed)`,
);
log(`${plan.unchanged} already correct`);
log(
  `${plan.unknownConferences.length} provider conferences have no Sanity conference`,
);
log(`${plan.unmatchedTeams.length} provider teams matched no single school`);
log(
  `${plan.conflicts.length} schools claimed by two teams (likely shared names; skipped)`,
);
log(
  `${plan.conferenceSports.length} conferences missing a sport their members play`,
);

// Schools the providers don't cover (NAIA, junior colleges, closed or merged
// schools): these need a person.
const filled = new Set(plan.add.map((change) => change.schoolId));
const stillWithout = schools
  .filter(
    (school) => school.affiliations.length === 0 && !filled.has(school._id),
  )
  .map((school) => school.name ?? school._id)
  .sort();
log(
  `${stillWithout.length} schools will still have no conference (listed in --out as "stillWithout")`,
);

const out = readFlag("--out");
if (out) {
  writeFileSync(out, `${JSON.stringify({ ...plan, stillWithout }, null, 2)}\n`);
  log(`Plan written to ${out}.`);
}

const sportIdBySlug = new Map(
  sanity.sports.map((sport) => [sport.slug, sport._id]),
);
const reference = (id: string) => ({ _type: "reference", _ref: id });

function affiliationPatch(changes: AffiliationChange[], replace: boolean) {
  const bySchool = new Map<string, AffiliationChange[]>();
  for (const change of changes) {
    bySchool.set(change.schoolId, [
      ...(bySchool.get(change.schoolId) ?? []),
      change,
    ]);
  }
  return [...bySchool].map(([schoolId, rows]) => ({
    patch: {
      id: schoolId,
      setIfMissing: { conferenceAffiliations: [] },
      ...(replace
        ? {
            // Drop this sport's old row; the new one is inserted below.
            unset: rows.map(
              (row) =>
                `conferenceAffiliations[sport._ref == "${sportIdBySlug.get(row.sport)}"]`,
            ),
          }
        : {}),
      insert: {
        after: "conferenceAffiliations[-1]",
        items: rows.map((row) => ({
          _type: "conferenceAffiliation",
          _key: randomUUID().slice(0, 12),
          sport: reference(sportIdBySlug.get(row.sport) as string),
          conference: reference(row.conferenceId),
        })),
      },
    },
  }));
}

if (hasFlag("--apply")) {
  await sanityMutate(affiliationPatch(plan.add, false));
  log(`Added ${plan.add.length} conference affiliations.`);
}
if (hasFlag("--apply-changed")) {
  await sanityMutate(affiliationPatch(plan.changed, true));
  log(`Replaced ${plan.changed.length} conference affiliations.`);
}
if (hasFlag("--add-conference-sports")) {
  await sanityMutate(
    plan.conferenceSports.map((gap) => ({
      patch: {
        id: gap.conferenceId,
        setIfMissing: { sports: [] },
        insert: {
          after: "sports[-1]",
          items: [
            {
              ...reference(sportIdBySlug.get(gap.sport) as string),
              _key: randomUUID().slice(0, 12),
            },
          ],
        },
      },
    })),
  );
  log(`Added ${plan.conferenceSports.length} sports to conferences.`);
}
