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

export type ValidDivision = (typeof VALID_DIVISIONS)[number];

export type VoteRankFields = {
  [K in `rank_${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25}`]?: string;
};

export function processBallotSanityIds(body: VoteRankFields) {
  const entries: Array<{ sanityId: string; rank: number; points: number }> = [];
  for (let i = 1; i <= 25; i++) {
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
