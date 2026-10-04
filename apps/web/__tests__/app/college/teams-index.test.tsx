import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockSanityFetchPage, mockGetRankedIds, mockGetPageMetadata } =
  vi.hoisted(() => ({
    mockSanityFetchPage: vi.fn(),
    mockGetRankedIds: vi.fn(),
    mockGetPageMetadata: vi.fn(() => ({ title: "College Teams" })),
  }));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  MIN_TEAM_PAGE_POSTS: 3,
  queryTeamsIndex: "queryTeamsIndex",
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwarePage: (
    _fallback: unknown,
    render: (options: { perspective: string; stega: boolean }) => unknown,
  ) => render({ perspective: "published", stega: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedRankedSchoolSanityIds: mockGetRankedIds,
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@/components/page-header", () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/page-transition", () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/teams/teams-directory", () => ({
  TeamsDirectory: ({
    teams,
    sports,
  }: {
    teams: { _id: string }[];
    sports: { slug: string; title: string }[];
  }) => (
    <div
      data-testid="directory"
      data-teams={teams.map((team) => team._id).join(",")}
      data-sports={sports.map((sport) => sport.title).join(",")}
    />
  ),
}));

import TeamsIndexPage, { generateMetadata } from "@/app/college/teams/page";

async function renderPage() {
  render((await TeamsIndexPage()) as ReactNode);
  return screen.getByTestId("directory");
}

describe("TeamsIndexPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockGetRankedIds.mockResolvedValue(["ndsu"]);
  });

  it("lists only the Sanity sports that have teams in the directory", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        teams: [
          {
            _id: "ndsu",
            affiliations: [{ sport: "football" }],
          },
          { _id: "drake", affiliations: [{ sport: "mens-basketball" }] },
          { _id: "loose", affiliations: null },
        ],
        sports: [
          { slug: "football", title: "Football" },
          { slug: "mens-basketball", title: "Men's Basketball" },
          { slug: "womens-basketball", title: "Women's Basketball" },
        ],
      },
    });

    const directory = await renderPage();

    expect(mockSanityFetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "queryTeamsIndex",
        params: { rankedIds: ["ndsu"], minPosts: 3 },
      }),
    );
    expect(screen.getByRole("heading", { name: "Teams" })).toBeInTheDocument();
    expect(directory).toHaveAttribute("data-teams", "ndsu,drake,loose");
    expect(directory).toHaveAttribute(
      "data-sports",
      "Football,Men's Basketball",
    );
  });

  it("renders an empty directory when the query returns nothing", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });

    const directory = await renderPage();

    expect(directory).toHaveAttribute("data-teams", "");
    expect(directory).toHaveAttribute("data-sports", "");
  });

  it("builds page metadata for the teams index", async () => {
    await expect(generateMetadata()).resolves.toEqual({
      title: "College Teams",
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "College Teams",
        slug: "/college/teams",
      }),
      "published",
    );
  });
});
