const { mockGetCachedVoterBreakdown } = vi.hoisted(() => ({
  mockGetCachedVoterBreakdown: vi.fn(),
}));

vi.mock("@/components/rankings/rankings-voter-breakdown", () => ({
  getCachedVoterBreakdown: mockGetCachedVoterBreakdown,
}));

import { loadVoterBreakdown } from "@/actions/load-voter-breakdown";

describe("loadVoterBreakdown", () => {
  const props = {
    division: "fbs",
    year: 2025,
    week: 1,
    sport: "football" as const,
    consensusRanks: [{ id: "team-1", rank: 1 }],
  };

  beforeEach(() => {
    mockGetCachedVoterBreakdown.mockReset();
  });

  it("returns the cached voter breakdown for the given props", async () => {
    const breakdown = [
      {
        name: "Voter One",
        organization: "Media",
        organizationRole: "Writer",
        ballot: [],
        matchPercent: 90,
      },
    ];
    mockGetCachedVoterBreakdown.mockResolvedValue(breakdown);

    await expect(loadVoterBreakdown(props)).resolves.toEqual(breakdown);
    expect(mockGetCachedVoterBreakdown).toHaveBeenCalledWith(props);
  });

  it("returns null when no breakdown is available", async () => {
    mockGetCachedVoterBreakdown.mockResolvedValue(null);

    await expect(loadVoterBreakdown(props)).resolves.toBeNull();
  });
});
