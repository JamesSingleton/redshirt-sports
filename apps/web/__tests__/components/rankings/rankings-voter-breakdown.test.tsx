import { render, screen } from "@testing-library/react";

import { RankingsVoterBreakdown } from "@/components/rankings/rankings-voter-breakdown";

const {
  mockGetSportIdBySlug,
  mockGetVotesForWeekAndYearByVoter,
  mockProcessVoterBallots,
  mockComputeBallotMatchPercent,
} = vi.hoisted(() => ({
  mockGetSportIdBySlug: vi.fn(),
  mockGetVotesForWeekAndYearByVoter: vi.fn(),
  mockProcessVoterBallots: vi.fn(),
  mockComputeBallotMatchPercent: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getSportIdBySlug: mockGetSportIdBySlug,
  getVotesForWeekAndYearByVoter: mockGetVotesForWeekAndYearByVoter,
}));

vi.mock("@/utils/process-ballots", () => ({
  processVoterBallots: mockProcessVoterBallots,
}));

vi.mock("@/lib/ballot-match", () => ({
  computeBallotMatchPercent: mockComputeBallotMatchPercent,
}));

vi.mock("@/components/rankings/voter-ballot-breakdown", () => ({
  __esModule: true,
  default: ({ voterBreakdown }: { voterBreakdown: unknown[] }) => (
    <div data-testid="voter-breakdown">{voterBreakdown.length}</div>
  ),
}));

describe("RankingsVoterBreakdown", () => {
  const props = {
    division: "fbs",
    year: 2025,
    week: 1,
    sport: "football" as const,
    consensusRanks: [{ _id: "team-1", rank: 1 }],
  };

  beforeEach(() => {
    mockGetSportIdBySlug.mockReset();
    mockGetVotesForWeekAndYearByVoter.mockReset();
    mockProcessVoterBallots.mockReset();
    mockComputeBallotMatchPercent.mockReset();
  });

  it("returns null when the sport cannot be resolved", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    const result = await RankingsVoterBreakdown(props);
    expect(result).toBeNull();
  });

  it("returns null when there are no processed ballots", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue([]);
    mockProcessVoterBallots.mockResolvedValue([]);

    const result = await RankingsVoterBreakdown(props);
    expect(result).toBeNull();
  });

  it("renders voter breakdown with computed match percentages", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue([{ id: "vote-1" }]);
    mockProcessVoterBallots.mockResolvedValue([
      {
        name: "Voter One",
        organization: "Media",
        organizationRole: "Writer",
        ballot: [{ _id: "team-1" }],
      },
    ]);
    mockComputeBallotMatchPercent.mockReturnValue(88);

    const component = await RankingsVoterBreakdown(props);
    render(component);

    expect(screen.getByTestId("voter-breakdown")).toHaveTextContent("1");
    expect(mockComputeBallotMatchPercent).toHaveBeenCalled();
  });
});
