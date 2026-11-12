import {
  type SchoolCandidate,
  scoreSchool,
  type TeamNames,
} from "../ratings/jobs/team-matching";

/**
 * Plans which conference each Sanity school plays in, per sport, from the
 * providers' membership lists. Pure: the CLI (cli/school-conferences.mts)
 * fetches the inputs and applies the result.
 */

export type SportSlug = "football" | "mens-basketball" | "womens-basketball";

/** A conference as a provider names it. */
export type ProviderConference = {
  name: string;
  shortName?: string | null;
  abbreviation?: string | null;
};

/** One team's membership in one conference for one sport, from a provider. */
export type ProviderMembership = {
  /** "ncaa-stats" is stats.ncaa.org's current lists; "ncaa" the older scoreboard feed. */
  source: "espn" | "ncaa-stats" | "ncaa";
  /** Season the list is from, e.g. "2026" or "2024-25". */
  season: string;
  sport: SportSlug;
  /** Division the provider lists the conference under ("d1", "d2", "d3"). */
  division: string;
  conference: ProviderConference;
  team: TeamNames & { espnId?: string | null };
};

export type SanityConference = {
  _id: string;
  name: string;
  shortName?: string | null;
  abbreviation?: string | null;
  division?: string | null;
  sports?: string[] | null;
};

export type SanitySchool = SchoolCandidate & {
  _id: string;
  affiliations: Array<{ sport: SportSlug; conferenceId: string }>;
};

/** Provider conference names that differ from ours. Keys are normalized. */
export const CONFERENCE_ALIASES: Record<string, string> = {
  "fbs independents": "FBS Independent",
  "fcs independents": "FCS Independents",
  "dii independent": "D2 Independent",
  "division ii independents": "D2 Independent",
  "ncaa division ii independents": "D2 Independent",
  "diii independent": "D3 Independent",
  "division iii independents": "D3 Independent",
  "ncaa division iii independents": "D3 Independent",
  "big south ovc": "Big South - OVC Football Association",
  "big south ovc football": "Big South - OVC Football Association",
  "big west": "The Big West Conference",
  summit: "The Summit League",
  "summit league": "The Summit League",
  "mid america intercollegiate":
    "Mid-America Intercollegiate Athletics Association",
  "mid american": "Mid-American Conference",
  "missouri valley football": "Missouri Valley Football Conference",
  "pioneer football": "Pioneer Football League",
  "america east": "America East Conference",
  "atlantic sun": "Atlantic Sun Conference",
  asun: "Atlantic Sun Conference",
  "sun belt": "Sun Belt Conference",
  "conference usa": "Conference USA",
  "american athletic": "American Conference",
  american: "American Conference",
  // ESPN's short names for Division II and III football conferences.
  "great lakes": "Great Lakes Valley Conference",
  "mid america": "Mid-America Intercollegiate Athletics Association",
  "northern sun": "Northern Sun Intercollegiate Conference",
  heartland: "Heartland Collegiate Athletic Conference",
  michigan: "Michigan Intercollegiate Athletic Association",
  minnesota: "Minnesota Intercollegiate Athletic Conference",
  "so cal": "Southern California Intercollegiate Athletic Conference",
  wisconsin: "Wisconsin Intercollegiate Athletic Conference",
  "independent dii": "D2 Independent",
  "independent diii": "D3 Independent",
  // The NCAA feed's names.
  "michigan intercol ath assn": "Michigan Intercollegiate Athletic Association",
  "mac commonwealth": "Middle Atlantic Conference",
  "mac freedom": "Middle Atlantic Conference",
};

/**
 * Conferences the providers list that Sanity doesn't have yet. Created only
 * with `--create-conferences`. From the NCAA's 2024-25 scoreboards: confirm a
 * conference still exists before creating it.
 */
export const NEW_CONFERENCES: Record<
  string,
  { name: string; shortName: string; abbreviation: string; division: string }
> = {
  "d2|pacwest": {
    name: "Pacific West Conference",
    shortName: "PacWest",
    abbreviation: "PacWest",
    division: "d2",
  },
  "d2|sunshine state": {
    name: "Sunshine State Conference",
    shortName: "Sunshine State",
    abbreviation: "SSC",
    division: "d2",
  },
  "d2|peach belt": {
    name: "Peach Belt Conference",
    shortName: "Peach Belt",
    abbreviation: "PBC",
    division: "d2",
  },
  "d2|great northwest": {
    name: "Great Northwest Athletic Conference",
    shortName: "Great Northwest",
    abbreviation: "GNAC",
    division: "d2",
  },
  "d2|ecc": {
    name: "East Coast Conference",
    shortName: "ECC",
    abbreviation: "ECC",
    division: "d2",
  },
  "d3|united east": {
    name: "United East Conference",
    shortName: "United East",
    abbreviation: "UEC",
    division: "d3",
  },
  "d3|great northeast": {
    name: "Great Northeast Athletic Conference",
    shortName: "Great Northeast",
    abbreviation: "GNAC",
    division: "d3",
  },
  "d3|north atlantic": {
    name: "North Atlantic Conference",
    shortName: "North Atlantic",
    abbreviation: "NAC",
    division: "d3",
  },
  "d3|sliac": {
    name: "St. Louis Intercollegiate Athletic Conference",
    shortName: "SLIAC",
    abbreviation: "SLIAC",
    division: "d3",
  },
  "d3|sunyac": {
    name: "State University of New York Athletic Conference",
    shortName: "SUNYAC",
    abbreviation: "SUNYAC",
    division: "d3",
  },
  "d3|amcc": {
    name: "Allegheny Mountain Collegiate Conference",
    shortName: "AMCC",
    abbreviation: "AMCC",
    division: "d3",
  },
  "d3|little east": {
    name: "Little East Conference",
    shortName: "Little East",
    abbreviation: "LEC",
    division: "d3",
  },
  "d3|cunyac": {
    name: "City University of New York Athletic Conference",
    shortName: "CUNYAC",
    abbreviation: "CUNYAC",
    division: "d3",
  },
  "d3|uaa": {
    name: "University Athletic Association",
    shortName: "UAA",
    abbreviation: "UAA",
    division: "d3",
  },
  "d3|atlantic east": {
    name: "Atlantic East Conference",
    shortName: "Atlantic East",
    abbreviation: "AEC",
    division: "d3",
  },
  "d3|c2c": {
    name: "Coast to Coast Athletic Conference",
    shortName: "C2C",
    abbreviation: "C2C",
    division: "d3",
  },
};

/** The NEW_CONFERENCES key for a provider conference, if it's one we'd create. */
export function newConferenceKey(name: string, division: string) {
  const key = `${division}|${normalizeConferenceName(name)}`;
  return NEW_CONFERENCES[key] ? key : null;
}

const STOP_WORDS = new Set([
  "the",
  "conference",
  "athletic",
  "athletics",
  "association",
  "league",
]);

/** "The Big West Conference" → "big west"; "Big South-OVC" → "big south ovc". */
export function normalizeConferenceName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word))
    .join(" ")
    .trim();
}

/**
 * Our conference for a provider's, by name, short name, or abbreviation, then
 * the alias table. Abbreviations only count within the same division: "MAC"
 * is the Mid-American in Division I and the Middle Atlantic in Division III.
 */
export function matchConference(
  provider: ProviderConference,
  division: string,
  conferences: SanityConference[],
): SanityConference | null {
  const providerNames = [provider.name, provider.shortName]
    .filter((value): value is string => Boolean(value))
    .map(normalizeConferenceName)
    .filter(Boolean);

  const byName = conferences.filter((conference) => {
    const ours = [conference.name, conference.shortName]
      .filter((value): value is string => Boolean(value))
      .map(normalizeConferenceName);
    return providerNames.some((name) => ours.includes(name));
  });
  if (byName.length === 1) return byName[0] ?? null;
  if (byName.length > 1) {
    // "MIAA" is a Division II and a Division III conference.
    const sameDivision = byName.filter(
      (conference) => conference.division === division,
    );
    return sameDivision.length === 1 ? (sameDivision[0] ?? null) : null;
  }

  const abbreviation = provider.abbreviation?.toLowerCase().trim();
  if (abbreviation) {
    const sameDivision = conferences.filter(
      (conference) =>
        conference.division === division &&
        [conference.abbreviation, conference.shortName].some(
          (value) => value?.toLowerCase().trim() === abbreviation,
        ),
    );
    if (sameDivision.length === 1) return sameDivision[0] ?? null;
  }

  for (const name of providerNames) {
    const alias = CONFERENCE_ALIASES[name];
    if (alias) {
      const found = conferences.find((conference) => conference.name === alias);
      if (found) return found;
    }
  }
  return null;
}

/** A name match is trusted at this score with this lead over the runner-up... */
const NAME_MATCH_MIN = 0.9;
const NAME_MATCH_LEAD = 0.1;
/** ...or, when the mascots agree ("UCF Knights" / Central Florida Knights), at this. */
const MASCOT_MATCH_MIN = 0.75;
const MASCOT_MATCH_LEAD = 0.2;

export type SchoolMatch =
  | { school: SanitySchool; by: "espn-id" | "name"; score: number }
  | { school: null; reason: "no-candidate" | "ambiguous"; best?: string[] };

/**
 * The Sanity school a provider team is. ESPN ids from Postgres are exact. A
 * name match must score high and clearly beat the runner-up; a matching
 * mascot lets a weaker name through ("UCF" for Central Florida).
 */
/**
 * "The University of Texas at Tyler" and "University of Minnesota, Morris"
 * compare equal to our "University of Texas at Tyler" and "University of
 * Minnesota-Morris". State qualifiers in parentheses are dropped.
 */
export function normalizeSchoolName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/^the /, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchSchool(
  team: ProviderMembership["team"],
  schools: SanitySchool[],
  schoolIdByEspnId: Map<string, string>,
): SchoolMatch {
  const byId = team.espnId ? schoolIdByEspnId.get(team.espnId) : undefined;
  if (byId) {
    const school = schools.find((candidate) => candidate._id === byId);
    if (school) return { school, by: "espn-id", score: 1 };
  }

  // An identical full name ("Northwest Missouri State University") is
  // trusted when exactly one school has it.
  const fullName = normalizeSchoolName(team.displayName);
  const sameName = fullName
    ? schools.filter(
        (school) =>
          normalizeSchoolName(school.name) === fullName ||
          normalizeSchoolName(school.shortName) === fullName,
      )
    : [];
  if (sameName.length === 1 && sameName[0]) {
    return { school: sameName[0], by: "name", score: 1 };
  }

  const ranked = schools
    .map((school) => ({ school, ...scoreSchool(team, school) }))
    .filter((entry) => entry.score > 0.3)
    .sort((a, b) => b.score - a.score);
  const [first, second] = ranked;
  if (!first) return { school: null, reason: "no-candidate" };
  const lead = first.score - (second?.score ?? 0);
  const strongName = first.score >= NAME_MATCH_MIN && lead >= NAME_MATCH_LEAD;
  const confirmedByMascot =
    first.mascot === true &&
    first.score >= MASCOT_MATCH_MIN &&
    lead >= MASCOT_MATCH_LEAD;
  if (strongName || confirmedByMascot) {
    return { school: first.school, by: "name", score: first.score };
  }
  return {
    school: null,
    reason: "ambiguous",
    best: ranked
      .slice(0, 3)
      .map((entry) => `${entry.school.name} (${entry.score.toFixed(2)})`),
  };
}

/**
 * The NCAA feed lists a team on every scoreboard it plays on, including
 * other divisions' (a Division II team at a Division III school). Keep each
 * team in the division where its conference has the most teams.
 */
export function dedupeAcrossDivisions(
  memberships: ProviderMembership[],
): ProviderMembership[] {
  const size = new Map<string, number>();
  const sizeKey = (m: ProviderMembership) =>
    `${m.source}|${m.sport}|${m.division}|${m.conference.name}`;
  for (const membership of memberships) {
    size.set(sizeKey(membership), (size.get(sizeKey(membership)) ?? 0) + 1);
  }
  const best = new Map<string, ProviderMembership>();
  for (const membership of memberships) {
    const key = `${membership.source}|${membership.sport}|${membership.team.espnId ?? membership.team.displayName}`;
    const current = best.get(key);
    if (
      !current ||
      (size.get(sizeKey(membership)) ?? 0) > (size.get(sizeKey(current)) ?? 0)
    ) {
      best.set(key, membership);
    }
  }
  return [...best.values()];
}

export type AffiliationChange = {
  schoolId: string;
  schoolName: string;
  sport: SportSlug;
  conferenceId: string;
  conferenceName: string;
  source: string;
  matchedBy: "espn-id" | "name";
};

export type AffiliationPlan = {
  /** Sports a school has no conference for yet. Safe to apply. */
  add: AffiliationChange[];
  /** The provider lists a different conference than Sanity has. Realignment or a data error; review. */
  changed: Array<AffiliationChange & { currentConferenceName: string }>;
  /** Already correct. */
  unchanged: number;
  /** Provider conferences with no Sanity conference; create them or extend the aliases. */
  unknownConferences: Array<{
    name: string;
    division: string;
    sports: SportSlug[];
    teams: number;
    source: string;
  }>;
  /** Two provider teams matched the same school with different conferences; skipped. */
  conflicts: Array<{
    schoolName: string;
    sport: SportSlug;
    conferences: string[];
  }>;
  /** Provider teams that couldn't be matched to one school. */
  unmatchedTeams: Array<{
    team: string;
    sport: SportSlug;
    conference: string;
    reason: string;
    best?: string[];
  }>;
  /** A conference has members in a sport it doesn't list; add the sport. */
  conferenceSports: Array<{
    conferenceId: string;
    name: string;
    sport: SportSlug;
  }>;
};

/**
 * Current lists beat old ones: ESPN and stats.ncaa.org are this season's,
 * the NCAA scoreboard feed stops at 2024-25.
 */
const SOURCE_RANK: Record<ProviderMembership["source"], number> = {
  espn: 3,
  "ncaa-stats": 2,
  ncaa: 1,
};

export function planAffiliations({
  memberships,
  schools,
  conferences,
  schoolIdByEspnId,
}: {
  memberships: ProviderMembership[];
  schools: SanitySchool[];
  conferences: SanityConference[];
  schoolIdByEspnId: Map<string, string>;
}): AffiliationPlan {
  const conferenceById = new Map(conferences.map((c) => [c._id, c]));
  const unknown = new Map<
    string,
    AffiliationPlan["unknownConferences"][number]
  >();
  const unmatched: AffiliationPlan["unmatchedTeams"] = [];
  const chosen = new Map<
    string,
    { membership: ProviderMembership; change: AffiliationChange }
  >();
  const conflicted = new Map<string, Set<string>>();

  for (const membership of memberships) {
    const conference = matchConference(
      membership.conference,
      membership.division,
      conferences,
    );
    if (!conference) {
      const key = `${membership.division}|${membership.conference.name}`;
      const entry = unknown.get(key) ?? {
        name: membership.conference.name,
        division: membership.division,
        sports: [],
        teams: 0,
        source: `${membership.source} ${membership.season}`,
      };
      if (!entry.sports.includes(membership.sport))
        entry.sports.push(membership.sport);
      entry.teams += 1;
      unknown.set(key, entry);
      continue;
    }

    const match = matchSchool(membership.team, schools, schoolIdByEspnId);
    if (!match.school) {
      unmatched.push({
        team: membership.team.displayName,
        sport: membership.sport,
        conference: conference.name,
        reason: match.reason,
        best: match.best,
      });
      continue;
    }

    const key = `${match.school._id}|${membership.sport}`;
    const existing = chosen.get(key);
    if (existing) {
      const rankExisting = SOURCE_RANK[existing.membership.source];
      const rankNew = SOURCE_RANK[membership.source];
      if (rankExisting > rankNew) continue;
      if (
        rankExisting === rankNew &&
        existing.change.conferenceId !== conference._id
      ) {
        // Two teams claim this school: most likely two schools share a name.
        const names =
          conflicted.get(key) ?? new Set([existing.change.conferenceName]);
        names.add(conference.name);
        conflicted.set(key, names);
        continue;
      }
      if (rankExisting === rankNew) continue;
    }
    chosen.set(key, {
      membership,
      change: {
        schoolId: match.school._id,
        schoolName: match.school.name ?? match.school._id,
        sport: membership.sport,
        conferenceId: conference._id,
        conferenceName: conference.name,
        source: `${membership.source} ${membership.season}`,
        matchedBy: match.by,
      },
    });
  }

  const plan: AffiliationPlan = {
    add: [],
    changed: [],
    unchanged: 0,
    unknownConferences: [...unknown.values()].sort(
      (a, b) => a.division.localeCompare(b.division) || b.teams - a.teams,
    ),
    unmatchedTeams: unmatched,
    conflicts: [],
    conferenceSports: [],
  };
  for (const [key, names] of conflicted) {
    const entry = chosen.get(key);
    chosen.delete(key);
    if (entry) {
      plan.conflicts.push({
        schoolName: entry.change.schoolName,
        sport: entry.change.sport,
        conferences: [...names],
      });
    }
  }
  const sportGaps = new Set<string>();

  for (const { change } of chosen.values()) {
    const school = schools.find(
      (candidate) => candidate._id === change.schoolId,
    );
    const current = school?.affiliations.find(
      (row) => row.sport === change.sport,
    );
    if (!current) plan.add.push(change);
    else if (current.conferenceId === change.conferenceId) plan.unchanged += 1;
    else {
      plan.changed.push({
        ...change,
        currentConferenceName:
          conferenceById.get(current.conferenceId)?.name ??
          current.conferenceId,
      });
    }

    const conference = conferenceById.get(change.conferenceId);
    const gapKey = `${change.conferenceId}|${change.sport}`;
    if (
      conference &&
      !conference.sports?.includes(change.sport) &&
      !sportGaps.has(gapKey)
    ) {
      sportGaps.add(gapKey);
      plan.conferenceSports.push({
        conferenceId: conference._id,
        name: conference.name,
        sport: change.sport,
      });
    }
  }

  const bySchool = (a: AffiliationChange, b: AffiliationChange) =>
    a.schoolName.localeCompare(b.schoolName) || a.sport.localeCompare(b.sport);
  plan.add.sort(bySchool);
  plan.changed.sort(bySchool);
  return plan;
}
