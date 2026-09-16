import { render, screen } from "@testing-library/react";

import {
  getCachedVoterBreakdown,
  RankingsVoterBreakdown,
} from "@/components/rankings/rankings-voter-breakdown";
import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";

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

vi.mock("@/lib/rankings-data", () => ({
  RANKINGS_CACHE_LIFE: { stale: 300, revalidate: 604800, expire: 2592000 },
  RANKINGS_CACHE_TAG: "rankings",
  rankingsSportTag: (sport: string) => `rankings:${sport}`,
  rankingsDivisionTag: (sport: string, division: string) =>
    `rankings:${sport}:${division}`,
  rankingsWeekTag: (
    sport: string,
    division: string,
    year: number,
    week: number,
  ) => `rankings:${sport}:${division}:${year}:${week}`,
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

describe("getCachedVoterBreakdown", () => {
  const props = {
    division: "fbs",
    year: 2025,
    week: 1,
    sport: "football" as const,
    consensusRanks: [{ id: "team-1", rank: 1 }],
  };

  beforeEach(() => {
    mockGetSportIdBySlug.mockReset();
    mockGetVotesForWeekAndYearByVoter.mockReset();
    mockProcessVoterBallots.mockReset();
    mockComputeBallotMatchPercent.mockReset();
  });

  it("returns null when the sport cannot be resolved", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    const result = await getCachedVoterBreakdown(props);
    expect(result).toBeNull();
  });

  it("returns null when there are no processed ballots", async () => {
    mockGetSportIdBySlug.mockResolvedValue("sport-1");
    mockGetVotesForWeekAndYearByVoter.mockResolvedValue([]);
    mockProcessVoterBallots.mockResolvedValue([]);

    const result = await getCachedVoterBreakdown(props);
    expect(result).toBeNull();
  });

  it("returns voter breakdown with computed match percentages", async () => {
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

    const voterBreakdown = await getCachedVoterBreakdown(props);
    expect(voterBreakdown).toHaveLength(1);
    expect(voterBreakdown?.[0]?.matchPercent).toBe(88);
    expect(mockComputeBallotMatchPercent).toHaveBeenCalled();

    render(<VoterBallotBreakdown voterBreakdown={voterBreakdown!} />);
    expect(screen.getByTestId("voter-breakdown")).toHaveTextContent("1");
  });
});

describe("RankingsVoterBreakdown", () => {
  const props = {
    division: "fbs",
    year: 2025,
    week: 1,
    sport: "football" as const,
    consensusRanks: [{ id: "team-1", rank: 1 }],
  };

  beforeEach(() => {
    mockGetSportIdBySlug.mockReset();
    mockGetVotesForWeekAndYearByVoter.mockReset();
    mockProcessVoterBallots.mockReset();
    mockComputeBallotMatchPercent.mockReset();
  });

  it("renders nothing when there is no breakdown", async () => {
    mockGetSportIdBySlug.mockResolvedValue(null);
    const ui = await RankingsVoterBreakdown(props);
    expect(ui).toBeNull();
  });

  it("renders voter ballots when breakdown exists", async () => {
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

    const ui = await RankingsVoterBreakdown(props);
    render(ui!);
    expect(screen.getByTestId("voter-breakdown")).toHaveTextContent("1");
  });
});
