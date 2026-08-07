import { render, screen } from "@testing-library/react";

import { sampleRankingTeam } from "../helpers/vote-fixtures";

/**
 * Rankings display flow: movement helpers + page rendering with prior week.
 * Complements rankings-week page smoke with a focused display contract.
 */

const { mockGetCachedYears, mockGetCachedWeeks, mockGetCachedFinalRankings } =
  vi.hoisted(() => ({
    mockGetCachedYears: vi.fn(),
    mockGetCachedWeeks: vi.fn(),
    mockGetCachedFinalRankings: vi.fn(),
  }));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedYearsThatHaveVotes: mockGetCachedYears,
  getCachedWeeksThatHaveVotes: mockGetCachedWeeks,
  getCachedFinalRankings: mockGetCachedFinalRankings,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://example.com",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: vi.fn(() => ({})),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => null,
  websiteId: "website-id",
}));

vi.mock("@/components/rankings/filters", () => ({
  RankingsFilters: () => null,
}));

vi.mock("@/components/rankings/rankings-voter-breakdown", () => ({
  RankingsVoterBreakdown: () => null,
}));

vi.mock("@/components/rankings/voter-breakdown-skeleton", () => ({
  VoterBreakdownSkeleton: () => null,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import CollegeFootballRankingsPage from "@/app/college/[sport]/rankings/[division]/[year]/[week]/page";

describe("rankings display flow", () => {
  it("shows up arrow when a team improves week over week", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }, { week: 2 }]);
    mockGetCachedFinalRankings.mockImplementation(
      async ({ week }: { week: number }) => ({
        rankings:
          week === 2
            ? [sampleRankingTeam("a", 1, 100, "Team A")]
            : [sampleRankingTeam("a", 5, 80, "Team A")],
      }),
    );

    const page = await CollegeFootballRankingsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        year: "2025",
        week: "2",
      }),
    });

    render(page);
    expect(screen.getByLabelText("up 4")).toBeInTheDocument();
    expect(screen.getByText("Team A")).toBeInTheDocument();
  });
});
