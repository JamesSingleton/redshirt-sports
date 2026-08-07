export const TEST_USER_ID = "user_test_123";
export const TEST_SPORT_ID = "sport_football";
export const TEST_POLL_ID = "poll_fbs";
export const TEST_WEEK_ID = "week_2025_1";

export const seasonInfoInSeason = {
  year: 2025,
  currentWeek: 1,
  votingWeek: 1,
  isPreseason: false,
  isRegularSeason: true,
  isPostseason: false,
};

export const seasonInfoOffSeason = {
  year: 2025,
  currentWeek: 1,
  votingWeek: 1,
  isPreseason: false,
  isRegularSeason: false,
  isPostseason: false,
};

export const testPoll = {
  id: TEST_POLL_ID,
  sportId: TEST_SPORT_ID,
  slug: "fbs",
  name: "FBS Top 25",
  isActive: true,
};

/** Full Top 25 ballot body with unique Sanity school IDs. */
export function ballotBody(overrides: Record<string, string> = {}) {
  const ranks: Record<string, string> = {};
  for (let i = 1; i <= 25; i++) {
    ranks[`rank_${i}`] = `sanity-school-${i}`;
  }
  return {
    sport: "football",
    division: "fbs",
    ...ranks,
    ...overrides,
  };
}

export function schoolIdMap(
  entries?: Array<[string, { id: string; top25Eligible: boolean | null }]>,
) {
  if (entries) return new Map(entries);
  const map = new Map<string, { id: string; top25Eligible: boolean | null }>();
  for (let i = 1; i <= 25; i++) {
    map.set(`sanity-school-${i}`, {
      id: `db-school-${i}`,
      top25Eligible: true,
    });
  }
  return map;
}

/** Legacy shape: sanityId → schoolId only (for older helpers). */
export function schoolIdOnlyMap() {
  return new Map(
    [...schoolIdMap().entries()].map(([sanityId, s]) => [sanityId, s.id]),
  );
}

export function voteParams(
  sport = "football",
  division = "fbs",
): Promise<{ sport: string; division: string }> {
  return Promise.resolve({ sport, division });
}

export const sampleBallotEntry = {
  id: "ballot-entry-1",
  userId: TEST_USER_ID,
  division: "fbs",
  week: 1,
  year: 2025,
  createdAt: new Date("2025-09-01T00:00:00Z"),
  teamId: "sanity-school-1",
  rank: 1,
  points: 25,
};

export const sampleRankingTeam = (
  id: string,
  rank: number | null,
  points = 100,
  shortName = id,
) => ({
  _id: id,
  rank,
  _points: points,
  shortName,
  abbreviation: shortName.slice(0, 3).toUpperCase(),
  name: shortName,
  firstPlaceVotes: rank === 1 ? 5 : 0,
  isTie: false,
  image: null,
});
