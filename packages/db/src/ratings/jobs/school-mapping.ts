import {
  type SchoolCandidate,
  sameMascot,
  scoreSchool,
  type TeamNames,
} from "./team-matching";

/** A provider team as the bulk matcher sees it. */
export type CatalogTeam = TeamNames & {
  externalId: string;
  /** Provider leagues that list this id ("football/college-football", …). */
  leagues?: string[];
};

const FOOTBALL = "football/college-football";

/**
 * The provider shares one id across sports in Division I, but below it a school often has one
 * id per sport (Bates is 121 in football and men's basketball, 130110 in women's).
 * Schools hold one team id, so same-named teams collapse to one: the football id,
 * else the id in the most leagues, else the oldest. The others ride along as `alternateIds`.
 */
export function collapseDuplicateTeams(
  teams: CatalogTeam[],
): Array<CatalogTeam & { alternateIds: string[] }> {
  const groups = new Map<string, CatalogTeam[]>();
  for (const team of teams) {
    const key = team.displayName.toLowerCase().replace(/\s+/g, " ").trim();
    const group = groups.get(key) ?? [];
    if (!group.some((other) => other.externalId === team.externalId))
      group.push(team);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => {
    const [chosen, ...rest] = [...group].sort(
      (a, b) =>
        Number(b.leagues?.includes(FOOTBALL) ?? false) -
          Number(a.leagues?.includes(FOOTBALL) ?? false) ||
        (b.leagues?.length ?? 0) - (a.leagues?.length ?? 0) ||
        Number(a.externalId) - Number(b.externalId),
    );
    return {
      ...(chosen as CatalogTeam),
      alternateIds: rest.map((team) => team.externalId),
    };
  });
}

/**
 * When a match is safe to save without an admin. Both sides must agree: the team is
 * the school's best match and the school is the team's, the mascots are the same,
 * the names overlap on their own (not via a dropped state qualifier like "Union (TN)"
 * vs the provider's "Union College", or an abbreviation), no other team's name fits better
 * (a stale nickname in our data could otherwise tip it), and the runner-up on either
 * side trails by a clear margin.
 */
export const AUTO_ACCEPT = {
  /** Name overlap before the mascot bonus ("St. Thomas" vs "St. Thomas (MN)" is 0.8). */
  minNameScore: 0.75,
  /** Gap to the next-best candidate, on the team's side and on the school's. */
  minMargin: 0.2,
} as const;

export type PlannedMapping = {
  schoolId: string;
  schoolName: string;
  externalId: string;
  teamName: string;
  score: number;
  /** Same-named provider ids not saved (see {@link collapseDuplicateTeams}). */
  alternateIds: string[];
};

export type MappingSuggestion = {
  externalId: string;
  teamName: string;
  score: number;
  alternateIds: string[];
};

export type ReviewReason =
  /** No provider team's name is close. */
  | "no-candidates"
  /** The mascots differ, or one side has none. */
  | "mascot-differs"
  | "no-mascot"
  /** The names only match loosely, or only once a state qualifier is dropped. */
  | "loose-name"
  /** Another provider team's name fits better; the mascot alone favored this one. */
  | "better-name-elsewhere"
  /** The team fits another school better. */
  | "contested"
  /** Two candidates are too close to call (often provider duplicates). */
  | "ambiguous";

export type ReviewItem = {
  schoolId: string;
  schoolName: string;
  reason: ReviewReason;
  suggestions: MappingSuggestion[];
};

export type MappingPlan = {
  accepted: PlannedMapping[];
  review: ReviewItem[];
};

type Edge = {
  team: CatalogTeam & { alternateIds: string[] };
  school: SchoolCandidate;
  raw: number;
  score: number;
  byName: number;
  plainByName: number;
  mascot: boolean | null;
};

const round = (value: number) => Math.round(value * 100) / 100;
const label = (school: SchoolCandidate) =>
  school.shortName ?? school.name ?? school.id;

const EPSILON = 1e-9;

/** The first auto-accept check that fails, or null when the match is confident. */
const inFootball = (edge: Edge) =>
  edge.team.leagues?.includes(FOOTBALL) ?? false;

/**
 * A basketball-only id with the same mascot as a football-listed best match is the
 * same school's sport-specific id, not a rival: South Dakota Mines is 613 in
 * football (and resolves in both basketball leagues), 107590 only in women's
 * basketball. The provider's football id is the one that works across sports.
 */
function isSportDuplicate(best: Edge, other: Edge): boolean {
  return (
    other.team.externalId !== best.team.externalId &&
    inFootball(best) &&
    !inFootball(other) &&
    sameMascot(best.team.mascot, other.team.mascot)
  );
}

function failedCheck(
  best: Edge | undefined,
  allCandidates: Edge[],
  rivals: Edge[],
): ReviewReason | null {
  if (!best) return "no-candidates";
  const candidates = allCandidates.filter(
    (edge) => !isSportDuplicate(best, edge),
  );
  if (best.mascot === false) return "mascot-differs";
  if (best.mascot === null) return "no-mascot";
  if (best.plainByName < AUTO_ACCEPT.minNameScore) return "loose-name";
  if (candidates.some((edge) => edge.byName > best.byName + EPSILON))
    return "better-name-elsewhere";
  if (rivals[0]?.school.id !== best.school.id) return "contested";
  const margin = AUTO_ACCEPT.minMargin - EPSILON;
  if (
    best.raw - (candidates[1]?.raw ?? 0) < margin ||
    best.raw - (rivals[1]?.raw ?? 0) < margin
  )
    return "ambiguous";
  return null;
}

/**
 * Pair unmapped schools with provider teams. Pure. Pass only schools without a team id;
 * teams whose id (or a same-named duplicate's id) is in `takenTeamIds` are left out,
 * so nothing here can overwrite or duplicate a mapping. Every school not
 * auto-accepted comes back for review with its best suggestions.
 */
export function planTeamIdMapping(input: {
  teams: CatalogTeam[];
  schools: SchoolCandidate[];
  takenTeamIds?: Set<string>;
  suggestionLimit?: number;
}): MappingPlan {
  const limit = input.suggestionLimit ?? 3;
  const taken = input.takenTeamIds ?? new Set<string>();
  const teams = collapseDuplicateTeams(
    // The provider lists placeholder "TBA" teams in some groups; they never play.
    input.teams.filter((team) => team.displayName !== "TBA"),
  ).filter(
    (team) =>
      !taken.has(team.externalId) &&
      !team.alternateIds.some((id) => taken.has(id)),
  );
  const byTeam = new Map<string, Edge[]>();
  const bySchool = new Map<string, Edge[]>();
  for (const team of teams) {
    for (const school of input.schools) {
      const result = scoreSchool(team, school);
      if (result.score <= 0.3) continue;
      const edge: Edge = { team, school, ...result };
      const forTeam = byTeam.get(team.externalId) ?? [];
      forTeam.push(edge);
      byTeam.set(team.externalId, forTeam);
      const forSchool = bySchool.get(school.id) ?? [];
      forSchool.push(edge);
      bySchool.set(school.id, forSchool);
    }
  }
  // Ties go to the football-listed id (see isSportDuplicate).
  const sorted = (edges: Edge[] | undefined) =>
    [...(edges ?? [])].sort(
      (a, b) => b.raw - a.raw || Number(inFootball(b)) - Number(inFootball(a)),
    );

  const accepted: PlannedMapping[] = [];
  const acceptedTeams = new Set<string>();
  const pending: SchoolCandidate[] = [];

  for (const school of input.schools) {
    const candidates = sorted(bySchool.get(school.id));
    const best = candidates[0];
    if (
      best &&
      failedCheck(
        best,
        candidates,
        sorted(byTeam.get(best.team.externalId)),
      ) === null
    ) {
      const duplicates = candidates.filter((edge) =>
        isSportDuplicate(best, edge),
      );
      acceptedTeams.add(best.team.externalId);
      for (const edge of duplicates) acceptedTeams.add(edge.team.externalId);
      accepted.push({
        schoolId: school.id,
        schoolName: label(school),
        externalId: best.team.externalId,
        teamName: best.team.displayName,
        score: round(best.score),
        alternateIds: [
          ...best.team.alternateIds,
          ...duplicates.map((edge) => edge.team.externalId),
        ],
      });
    } else {
      pending.push(school);
    }
  }

  const acceptedSchools = new Set(accepted.map((m) => m.schoolId));
  // Review against what is left: a team another school just claimed isn't offered again.
  const review: ReviewItem[] = pending.map((school) => {
    const all = sorted(bySchool.get(school.id));
    const candidates = all.filter(
      (edge) => !acceptedTeams.has(edge.team.externalId),
    );
    const rivalsOf = (edge: Edge | undefined) =>
      sorted(byTeam.get(edge?.team.externalId ?? ""));
    return {
      schoolId: school.id,
      schoolName: label(school),
      // Why it failed with every team in play, else with what's left; null means its
      // best team went to another school.
      reason:
        failedCheck(all[0], all, rivalsOf(all[0])) ??
        failedCheck(
          candidates[0],
          candidates,
          rivalsOf(candidates[0]).filter(
            (edge) => !acceptedSchools.has(edge.school.id),
          ),
        ) ??
        "contested",
      suggestions: candidates.slice(0, limit).map((edge) => ({
        externalId: edge.team.externalId,
        teamName: edge.team.displayName,
        score: round(edge.score),
        alternateIds: edge.team.alternateIds,
      })),
    };
  });
  review.sort((a, b) => a.schoolName.localeCompare(b.schoolName));
  return { accepted, review };
}
