import type { SportParam } from "@/utils/espn";

export const SPORT_SLUG_MAP: Record<string, SportParam> = {
  football: "football",
  "mens-basketball": "mens-basketball",
  "womens-basketball": "womens-basketball",
};

export const VALID_DIVISIONS = [
  "fbs",
  "fcs",
  "d2",
  "d3",
  "mid-major",
  "power-conferences",
] as const;

export const BALLOT_SIZE = 25;

export type ValidDivision = (typeof VALID_DIVISIONS)[number];

export type VoteRankFields = {
  [K in `rank_${number}`]?: string;
};

export type BallotSanityEntry = {
  sanityId: string;
  rank: number;
  points: number;
};

export function processBallotSanityIds(
  body: VoteRankFields,
): BallotSanityEntry[] {
  const entries: BallotSanityEntry[] = [];
  for (let i = 1; i <= BALLOT_SIZE; i++) {
    const rankKey = `rank_${i}` as keyof VoteRankFields;
    const teamId = body[rankKey];
    if (teamId && typeof teamId === "string") {
      entries.push({
        sanityId: teamId,
        rank: i,
        points: 26 - i,
      });
    }
  }
  return entries;
}

/**
 * Validates a processed ballot for production submit:
 * exactly 25 ranks filled, no duplicate schools.
 */
export function validateBallotEntries(
  entries: BallotSanityEntry[],
): string | null {
  if (entries.length !== BALLOT_SIZE) {
    return `Ballot must rank exactly ${BALLOT_SIZE} teams (got ${entries.length})`;
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.sanityId)) {
      return `Duplicate team on ballot: ${entry.sanityId}`;
    }
    seen.add(entry.sanityId);
  }

  for (let rank = 1; rank <= BALLOT_SIZE; rank++) {
    if (!entries.some((e) => e.rank === rank)) {
      return `Missing rank ${rank} on ballot`;
    }
  }

  return null;
}

export function validateSport(sport: string): SportParam {
  const validSport = SPORT_SLUG_MAP[sport];
  if (!validSport) {
    throw new Error(
      `Invalid sport: ${sport}. Must be one of: ${Object.keys(SPORT_SLUG_MAP).join(", ")}`,
    );
  }
  return validSport;
}

export function validateDivision(division: string): ValidDivision {
  if (!VALID_DIVISIONS.includes(division as ValidDivision)) {
    throw new Error(
      `Invalid division: ${division}. Must be one of: ${VALID_DIVISIONS.join(", ")}`,
    );
  }
  return division as ValidDivision;
}
