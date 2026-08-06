import { type Mock, vi } from "vitest";

export type DbQueryMocks = {
  getSportIdBySlug: Mock;
  getPollBySportAndSlug: Mock;
  isUserAssignedToPoll: Mock;
  hasVoterVoted: Mock;
  resolveWeekIdForLegacyWeek: Mock;
  getSchoolIdsBySanityIds: Mock;
  submitBallot: Mock;
  getVoterBallots: Mock;
  getLatestVoterBallot: Mock;
  createUser: Mock;
  updateUser: Mock;
  revokeAssignmentsForNonVoters: Mock;
  upsertSchoolFromSanity: Mock;
  getCurrentSeasonStartAndEnd: Mock;
  publishPollRankingsForWeek: Mock;
  getYearsWithVotes: Mock;
  getYearsThatHaveVotes: Mock;
  getWeeksThatHaveVotes: Mock;
  getFinalRankingsForWeekAndYear: Mock;
  getVotesForWeekAndYearByVoter: Mock;
};

/** Factory for DB query mocks — call inside `vi.hoisted(() => createDbQueryMocks())`. */
export function createDbQueryMocks(): DbQueryMocks {
  return {
    getSportIdBySlug: vi.fn(),
    getPollBySportAndSlug: vi.fn(),
    isUserAssignedToPoll: vi.fn(),
    hasVoterVoted: vi.fn(),
    resolveWeekIdForLegacyWeek: vi.fn(),
    getSchoolIdsBySanityIds: vi.fn(),
    submitBallot: vi.fn(),
    getVoterBallots: vi.fn(),
    getLatestVoterBallot: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    revokeAssignmentsForNonVoters: vi.fn(),
    upsertSchoolFromSanity: vi.fn(),
    getCurrentSeasonStartAndEnd: vi.fn(),
    publishPollRankingsForWeek: vi.fn(),
    getYearsWithVotes: vi.fn(),
    getYearsThatHaveVotes: vi.fn(),
    getWeeksThatHaveVotes: vi.fn(),
    getFinalRankingsForWeekAndYear: vi.fn(),
    getVotesForWeekAndYearByVoter: vi.fn(),
  };
}
