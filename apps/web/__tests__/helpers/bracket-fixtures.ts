import {
  BRACKET_FORMAT_SEEDS,
  type BracketGameState,
  type BracketSlotEntry,
  type BracketTeamStatsSet,
  buildBracketView,
  type TeamResult,
} from "@redshirt-sports/db/playoff-bracket";
import type { BracketEditionSummary } from "@redshirt-sports/db/queries";

export const FCS_SPEC = BRACKET_FORMAT_SEEDS.find(
  (row) => row.key === "fcs-24-seed16-v2024",
)!.spec;

export function bracketSlots(count = 24): BracketSlotEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    slotKey: `seed-${index + 1}`,
    team: {
      schoolId: `school-${index + 1}`,
      name: `School ${index + 1} University`,
      shortName: `School ${index + 1}`,
      abbreviation: `S${index + 1}`,
      slug: index === 0 ? null : `school-${index + 1}`,
      image: null,
    },
    bidType: null,
    bidLabel: null,
  }));
}

export function bracketView(games: BracketGameState[] = []) {
  return buildBracketView(FCS_SPEC, bracketSlots(), games);
}

export function bracketEdition(
  overrides: Partial<BracketEditionSummary> = {},
): BracketEditionSummary {
  return {
    id: "edition-1",
    kind: "projection",
    status: "published",
    formatId: "format-1",
    formatKey: "fcs-24-seed16-v2024",
    sportId: "sport-1",
    sportSlug: "football",
    divisionSlug: "fcs",
    seasonId: "season-1",
    year: 2026,
    weekId: "week-7",
    weekNumber: 7,
    articleUrl: null,
    publicNote: null,
    publishedAt: new Date("2026-10-14T12:00:00Z"),
    updatedAt: new Date("2026-10-14T12:00:00Z"),
    ...overrides,
  };
}

/** Stats for seeds 1 and 16 and the unseeded 24: enough for one panel. */
export function bracketStats(): BracketTeamStatsSet {
  const result = (
    gameId: string,
    opponentSchoolId: string | null,
    won: boolean,
    overrides: Partial<TeamResult> = {},
  ): TeamResult => ({
    gameId,
    kickoffAt: new Date("2026-10-03T19:00:00Z"),
    opponentSchoolId,
    opponentName: opponentSchoolId ?? "Tusculum",
    opponentLevel: "FCS",
    site: "home",
    teamScore: won ? 31 : 14,
    opponentScore: won ? 14 : 31,
    won,
    overtime: false,
    ...overrides,
  });
  return {
    asOf: { pollWeek: 8, ratingsWeek: 8, ratingsPoolSize: 128 },
    teams: {
      "school-1": {
        schoolId: "school-1",
        record: { wins: 8, losses: 0 },
        divisionRecord: { wins: 7, losses: 0 },
        poll: { rank: 1, points: 572, firstPlaceVotes: 20, isTie: false },
        ratings: { powerRank: 3, sorRank: 1, sosRank: null },
        results: [result("a1", null, true, { kickoffAt: null, site: "away" })],
      },
      "school-16": {
        schoolId: "school-16",
        record: { wins: 6, losses: 2 },
        divisionRecord: { wins: 5, losses: 1 },
        poll: { rank: 16, points: 258, firstPlaceVotes: 0, isTie: false },
        ratings: { powerRank: 16, sorRank: 15, sosRank: 76 },
        results: [
          result("h2h", "school-24", false, { overtime: true }),
          result("n1", null, true, { site: "neutral" }),
        ],
      },
      "school-24": {
        schoolId: "school-24",
        record: { wins: 6, losses: 2 },
        divisionRecord: { wins: 6, losses: 1 },
        poll: null,
        ratings: { powerRank: 24, sorRank: 12, sosRank: 65 },
        results: [result("h2h", "school-16", true, { overtime: true })],
      },
    },
  };
}
