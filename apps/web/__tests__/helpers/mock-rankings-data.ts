import { type Mock, vi } from "vitest";

import { sampleRankingTeam } from "./vote-fixtures";

export type RankingsDataMocks = {
  getCachedYearsThatHaveVotes: Mock;
  getCachedWeeksThatHaveVotes: Mock;
  getCachedFinalRankings: Mock;
  getCachedBallotsForWeek: Mock;
  getCachedNavbarLatestRankings: Mock;
  getCachedSchoolRankingHistory: Mock;
  getCachedSchoolHasPollRankings: Mock;
  getCachedRankedSchoolSanityIds: Mock;
};

export const sampleYears = [2024, 2025];
export const sampleWeeks = [
  { week: 0, year: 2025, label: "Preseason" },
  { week: 1, year: 2025, label: "Week 1" },
];

export const sampleFinalRankings = [
  sampleRankingTeam("school-1", 1, 1500, "Team One"),
  sampleRankingTeam("school-2", 2, 1400, "Team Two"),
];

/** Factory for rankings-data mocks — call inside `vi.hoisted`. */
export function createRankingsDataMocks(): RankingsDataMocks {
  return {
    getCachedYearsThatHaveVotes: vi.fn().mockResolvedValue(sampleYears),
    getCachedWeeksThatHaveVotes: vi.fn().mockResolvedValue(sampleWeeks),
    getCachedFinalRankings: vi.fn().mockResolvedValue(sampleFinalRankings),
    getCachedBallotsForWeek: vi.fn().mockResolvedValue([]),
    getCachedNavbarLatestRankings: vi.fn().mockResolvedValue([
      {
        sport: "football",
        divisions: [{ division: "fbs", week: 1, year: 2025 }],
      },
    ]),
    getCachedSchoolRankingHistory: vi.fn().mockResolvedValue({}),
    getCachedSchoolHasPollRankings: vi.fn().mockResolvedValue(true),
    getCachedRankedSchoolSanityIds: vi
      .fn()
      .mockResolvedValue(["school-1", "school-2"]),
  };
}
