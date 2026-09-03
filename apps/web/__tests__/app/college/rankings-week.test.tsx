import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { sampleRankingTeam } from "../../helpers/vote-fixtures";

const {
  mockGetCachedYears,
  mockGetCachedWeeks,
  mockGetCachedFinalRankings,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
} = vi.hoisted(() => ({
  mockGetCachedYears: vi.fn(),
  mockGetCachedWeeks: vi.fn(),
  mockGetCachedFinalRankings: vi.fn(),
  mockGetDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Rankings" })),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedYearsThatHaveVotes: mockGetCachedYears,
  getCachedWeeksThatHaveVotes: mockGetCachedWeeks,
  getCachedFinalRankings: mockGetCachedFinalRankings,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data }: { data: { "@graph": unknown[] } }) => (
    <script
      data-testid="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  ),
  websiteId: "website-id",
}));

vi.mock("@/components/rankings/filters", () => ({
  RankingsFilters: () => <div data-testid="rankings-filters" />,
}));

vi.mock("@/components/rankings/rankings-voter-breakdown", () => ({
  RankingsVoterBreakdown: () => <div data-testid="voter-breakdown" />,
}));

vi.mock("@/components/rankings/voter-breakdown-skeleton", () => ({
  VoterBreakdownSkeleton: () => <div data-testid="voter-skeleton" />,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" data-testid="school-logo" />,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import CollegeFootballRankingsPage, {
  generateMetadata,
} from "@/app/college/[sport]/rankings/[division]/[year]/[week]/page";

describe("CollegeFootballRankingsPage", () => {
  beforeEach(() => {
    mockGetCachedYears.mockReset();
    mockGetCachedWeeks.mockReset();
    mockGetCachedFinalRankings.mockReset();
    mockGetPageMetadata.mockClear();
  });

  it("generateMetadata builds rankings metadata", async () => {
    await generateMetadata({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        year: "2025",
        week: "1",
      }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "/college/football/rankings/fbs/2025/1",
      }),
      "published",
    );
  });

  it("throws notFound when rankings fetch rejects", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }]);
    mockGetCachedFinalRankings.mockRejectedValue(new Error("db down"));

    await expect(
      CollegeFootballRankingsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          year: "2025",
          week: "1",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("throws notFound for an invalid week segment before fetching rankings", async () => {
    await expect(
      CollegeFootballRankingsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fcs",
          year: "2025",
          week: "garbage",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetCachedYears).not.toHaveBeenCalled();
    expect(mockGetCachedWeeks).not.toHaveBeenCalled();
    expect(mockGetCachedFinalRankings).not.toHaveBeenCalled();
  });

  it("throws notFound from metadata for an invalid week segment", async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({
          sport: "football",
          division: "fcs",
          year: "2025",
          week: "garbage",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetPageMetadata).not.toHaveBeenCalled();
  });

  it("throws notFound when there are no years or weeks with votes", async () => {
    mockGetCachedYears.mockResolvedValue([]);
    mockGetCachedWeeks.mockResolvedValue([]);

    await expect(
      CollegeFootballRankingsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          year: "2025",
          week: "1",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetCachedFinalRankings).not.toHaveBeenCalled();
  });

  it("renders movement, dropped out, ORV, and no-longer-receiving sections", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }, { week: 2 }]);

    const previous = [
      sampleRankingTeam("stay", 1, 200, "Alabama"),
      sampleRankingTeam("dropout", 24, 40, "Mercer"),
      sampleRankingTeam("gone", 10, 5, "Vanished"),
    ];
    // "gone" has points but will be absent from current → no longer receiving votes
    // after filtering out dropouts from Top 25
    previous[2] = sampleRankingTeam("gone", 26, 12, "Vanished");

    const current = [
      sampleRankingTeam("stay", 2, 180, "Alabama"),
      sampleRankingTeam("new", 5, 150, "Montana"),
      sampleRankingTeam("orv", null, 8, "ORV Team"),
      sampleRankingTeam("dropout", null, 10, "Mercer"),
    ];

    mockGetCachedFinalRankings.mockImplementation(
      async ({ week }: { week: number }) => {
        if (week === 2) return { rankings: current };
        if (week === 1) return { rankings: previous };
        return { rankings: [] };
      },
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

    expect(screen.getByLabelText("down 1")).toBeInTheDocument();
    expect(screen.getByLabelText("new to rankings")).toBeInTheDocument();
    expect(screen.getByText(/Dropped Out of Top 25/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mercer (24)" })).toHaveAttribute(
      "href",
      "/college/teams/mercer",
    );
    expect(screen.getByText(/Others receiving votes/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ORV Team/ })).toHaveAttribute(
      "href",
      "/college/teams/orv-team",
    );
    expect(screen.getByText(/No longer receiving votes/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vanished" })).toHaveAttribute(
      "href",
      "/college/teams/vanished",
    );
    expect(screen.getByRole("link", { name: "Alabama" })).toHaveAttribute(
      "href",
      "/college/teams/alabama",
    );

    const jsonLd = screen.getByTestId("json-ld");
    const data = JSON.parse(jsonLd.innerHTML);
    const itemList = data["@graph"].find(
      (n: { "@type": string }) => n["@type"] === "ItemList",
    );
    expect(itemList.numberOfItems).toBe(2); // stay + new in Top 25
  });

  it("renders poll-not-found message when rankings data is empty", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }]);
    mockGetCachedFinalRankings.mockResolvedValue({ rankings: [] });

    const page = await CollegeFootballRankingsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        year: "2025",
        week: "1",
      }),
    });

    render(page);
    expect(screen.getByText("Top 25 Poll Not Found")).toBeInTheDocument();
  });

  it("renders tied ranks and first-place vote counts", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }]);
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [
        {
          ...sampleRankingTeam("tied", 1, 200, "Alabama"),
          isTie: true,
          firstPlaceVotes: 3,
        },
      ],
    });

    const page = await CollegeFootballRankingsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        year: "2025",
        week: "1",
      }),
    });
    render(page);

    expect(screen.getByText("T-1")).toBeInTheDocument();
    expect(screen.getByText("(3)")).toBeInTheDocument();
  });

  it("falls back through shortName and abbreviation for team display names", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }]);
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [
        {
          ...sampleRankingTeam("abbr", 1, 200, "Alabama"),
          shortName: null,
          abbreviation: "ALA",
          name: "University of Alabama",
        },
        {
          ...sampleRankingTeam("name-only", 2, 180, "Georgia"),
          shortName: null,
          abbreviation: null,
          name: "University of Georgia",
        },
      ],
    });

    const page = await CollegeFootballRankingsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        year: "2025",
        week: "1",
      }),
    });
    render(page);

    expect(screen.getByRole("link", { name: "ALA" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "University of Georgia" }),
    ).toBeInTheDocument();
  });

  it("joins multiple dropped-out and no-longer-receiving teams with commas", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }, { week: 2 }]);

    const previous = [
      sampleRankingTeam("stay", 1, 200, "Alabama"),
      sampleRankingTeam("dropout-a", 24, 40, "Mercer"),
      sampleRankingTeam("dropout-b", 25, 35, "Samford"),
      sampleRankingTeam("gone-a", 26, 12, "Vanished A"),
      sampleRankingTeam("gone-b", 27, 8, "Vanished B"),
    ];
    const current = [
      sampleRankingTeam("stay", 1, 200, "Alabama"),
      sampleRankingTeam("dropout-a", null, 10, "Mercer"),
      sampleRankingTeam("dropout-b", null, 5, "Samford"),
    ];

    mockGetCachedFinalRankings.mockImplementation(
      async ({ week }: { week: number }) => {
        if (week === 2) return { rankings: current };
        if (week === 1) return { rankings: previous };
        return { rankings: [] };
      },
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

    expect(
      screen.getByRole("link", { name: "Mercer (24)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Samford (25)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Vanished A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Vanished B" }),
    ).toBeInTheDocument();
  });

  it("throws notFound when year and week lookups fail", async () => {
    mockGetCachedYears.mockRejectedValue(new Error("years failed"));
    mockGetCachedWeeks.mockRejectedValue(new Error("weeks failed"));

    await expect(
      CollegeFootballRankingsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          year: "2025",
          week: "1",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockGetCachedFinalRankings).not.toHaveBeenCalled();
  });
});
