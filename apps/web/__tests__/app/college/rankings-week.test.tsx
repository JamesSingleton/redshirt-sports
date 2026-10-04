import { render, screen, within } from "@testing-library/react";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import RankingsPageSkeleton from "@/components/rankings/rankings-page-skeleton";
import { sampleRankingTeam } from "../../helpers/vote-fixtures";

const {
  mockGetCachedYears,
  mockGetCachedWeeks,
  mockGetCachedFinalRankings,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockDraftAwareParamsPage,
} = vi.hoisted(() => ({
  mockGetCachedYears: vi.fn(),
  mockGetCachedWeeks: vi.fn(),
  mockGetCachedFinalRankings: vi.fn(),
  mockGetDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Rankings" })),
  mockDraftAwareParamsPage: vi.fn(
    async (
      params: Promise<unknown>,
      _fallback: unknown,
      render: (resolved: unknown) => Promise<React.ReactNode>,
    ) => render(await params),
  ),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: mockDraftAwareParamsPage,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedYearsThatHaveVotes: mockGetCachedYears,
  getCachedWeeksThatHaveVotes: mockGetCachedWeeks,
  getCachedFinalRankings: mockGetCachedFinalRankings,
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
  RankingsFilters: ({
    currentYear,
    currentWeek,
  }: {
    currentYear: string;
    currentWeek: string;
  }) => (
    <div
      data-testid="rankings-filters"
      data-year={currentYear}
      data-week={currentWeek}
    />
  ),
}));

vi.mock("@/components/rankings/rankings-voter-breakdown", () => ({
  RankingsVoterBreakdown: () => <div data-testid="voter-breakdown" />,
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

function pollNote(title: string) {
  const term = screen.getByText(`${title}:`);
  const definition = term.nextElementSibling;
  if (!(definition instanceof HTMLElement)) {
    throw new Error(`No poll note for ${title}`);
  }
  return definition;
}

describe("CollegeFootballRankingsPage", () => {
  beforeEach(() => {
    mockGetCachedYears.mockReset();
    mockGetCachedWeeks.mockReset();
    mockGetCachedFinalRankings.mockReset();
    mockGetPageMetadata.mockClear();
    mockDraftAwareParamsPage.mockClear();
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

  it("passes the route loading UI as the nearest Suspense fallback", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }]);
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [sampleRankingTeam("stay", 1, 200, "Alabama")],
    });

    await CollegeFootballRankingsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        year: "2025",
        week: "1",
      }),
    });

    const fallback = mockDraftAwareParamsPage.mock.calls[0]?.[1];
    expect(isValidElement(fallback)).toBe(true);
    expect((fallback as ReactElement).type).toBe(RankingsPageSkeleton);
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

  it.each([
    { year: "2026", week: "5.svg" },
    { year: "2026.svg", week: "5" },
  ])(
    "throws notFound for a file-extension URL ($year/$week)",
    async ({ year, week }) => {
      const params = { sport: "football", division: "fcs", year, week };

      await expect(
        CollegeFootballRankingsPage({ params: Promise.resolve(params) }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
      await expect(
        generateMetadata({ params: Promise.resolve(params) }),
      ).rejects.toThrow("NEXT_NOT_FOUND");

      expect(mockGetCachedYears).not.toHaveBeenCalled();
      expect(mockGetPageMetadata).not.toHaveBeenCalled();
    },
  );

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
    expect(pollNote("Dropped out")).toHaveTextContent("Mercer (was No. 24)");
    expect(
      within(pollNote("Dropped out")).getByRole("link", { name: "Mercer" }),
    ).toHaveAttribute("href", "/college/teams/mercer");
    expect(pollNote("Others receiving votes")).toHaveTextContent(
      "ORV Team 8, Mercer 10",
    );
    expect(screen.getByRole("link", { name: "ORV Team" })).toHaveAttribute(
      "href",
      "/college/teams/orv-team",
    );
    expect(pollNote("No longer receiving votes")).toHaveTextContent("Vanished");
    expect(screen.getByRole("link", { name: "Vanished" })).toHaveAttribute(
      "href",
      "/college/teams/vanished",
    );
    expect(screen.getAllByRole("link", { name: "Alabama" })[0]).toHaveAttribute(
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
    expect(screen.getByText("No poll for this week")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Latest polls" })).toHaveAttribute(
      "href",
      "/college/football/rankings",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("voter-breakdown")).not.toBeInTheDocument();
  });

  it("renders the poll header, table, filters, and voter breakdown", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }]);
    mockGetCachedFinalRankings.mockResolvedValue({
      rankings: [sampleRankingTeam("stay", 1, 200, "Alabama")],
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

    expect(
      screen.getByRole("heading", { level: 1, name: "FBS Top 25" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2025 Week 1")).toBeInTheDocument();
    expect(screen.getByTestId("rankings-filters")).toHaveAttribute(
      "data-year",
      "2025",
    );
    expect(screen.getByTestId("rankings-filters")).toHaveAttribute(
      "data-week",
      "1",
    );
    const poll = screen.getByRole("region", { name: "FBS Top 25 poll" });
    const [, row] = within(poll).getAllByRole("row");
    expect(row).toHaveTextContent("1Alabama(5)200");
    expect(await screen.findByTestId("voter-breakdown")).toBeInTheDocument();
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

    expect(screen.getByText("T1")).toBeInTheDocument();
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

    expect(screen.getAllByRole("link", { name: "ALA" })[0]).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "University of Georgia" }),
    ).toBeInTheDocument();
  });

  it("lists every dropped-out and no-longer-receiving team", async () => {
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

    expect(pollNote("Dropped out")).toHaveTextContent(
      "Mercer (was No. 24), Samford (was No. 25)",
    );
    expect(pollNote("No longer receiving votes")).toHaveTextContent(
      "Vanished A, Vanished B",
    );
  });

  it("separates multiple newcomers and labels unnamed ORV teams by name", async () => {
    mockGetCachedYears.mockResolvedValue([{ year: 2025 }]);
    mockGetCachedWeeks.mockResolvedValue([{ week: 1 }, { week: 2 }]);

    const previous = [sampleRankingTeam("stay", 1, 200, "Alabama")];
    const current = [
      sampleRankingTeam("stay", 1, 200, "Alabama"),
      sampleRankingTeam("new-a", 2, 150, "Montana"),
      sampleRankingTeam("new-b", 3, 140, "Idaho"),
      {
        ...sampleRankingTeam("orv", null, 8, "ORV Team"),
        shortName: null,
        abbreviation: null,
        name: "Others University",
      },
    ];

    mockGetCachedFinalRankings.mockImplementation(
      async ({ week }: { week: number }) => ({
        rankings: week === 2 ? current : previous,
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

    const newcomers = screen.getByText("New to the Top 25").nextElementSibling;
    expect(newcomers).toHaveTextContent("Montana No. 2, Idaho No. 3");
    expect(pollNote("Others receiving votes")).toHaveTextContent(
      "Others University 8",
    );
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
