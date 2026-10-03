import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockSanityFetchStaticParams,
  mockFetchGlobalSeoSettings,
  mockGetCachedRankedSchoolSanityIds,
  mockGetCachedSchoolRankingHistory,
  mockGetCachedSchoolHasPollRankings,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
  mockIsTransferPortalEnabled,
  mockGetCachedSchoolTransfers,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockSanityFetchStaticParams: vi.fn(),
  mockFetchGlobalSeoSettings: vi.fn().mockResolvedValue({ socialLinks: {} }),
  mockGetCachedRankedSchoolSanityIds: vi.fn().mockResolvedValue([]),
  mockGetCachedSchoolRankingHistory: vi.fn().mockResolvedValue({ polls: [] }),
  mockGetCachedSchoolHasPollRankings: vi.fn().mockResolvedValue(false),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Team Page" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockIsTransferPortalEnabled: vi.fn(() => false),
  mockGetCachedSchoolTransfers: vi.fn(),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: (
    params: Promise<{ slug: string }>,
    _fallback: unknown,
    render: (
      resolved: { slug: string },
      options: { perspective: string; stega: boolean },
    ) => Promise<unknown>,
  ) =>
    params.then((resolved) =>
      render(resolved, { perspective: "published", stega: false }),
    ),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetchMetadata: mockSanityFetchMetadata,
  sanityFetchStaticParams: mockSanityFetchStaticParams,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  MIN_TEAM_PAGE_POSTS: 8,
  postsBySchoolAndStoryTypeQuery: "postsBySchoolAndStoryTypeQuery",
  postsBySchoolQuery: "postsBySchoolQuery",
  querySchoolPaths: "querySchoolPaths",
  schoolBySlugQuery: "schoolBySlugQuery",
  schoolSlugsByIdsQuery: "schoolSlugsByIdsQuery",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  fetchGlobalSeoSettings: mockFetchGlobalSeoSettings,
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedRankedSchoolSanityIds: mockGetCachedRankedSchoolSanityIds,
  getCachedSchoolHasPollRankings: mockGetCachedSchoolHasPollRankings,
  getCachedSchoolRankingHistory: mockGetCachedSchoolRankingHistory,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/json-ld", () => ({
  TeamPageJsonLd: () => <script data-testid="team-json-ld" />,
}));

vi.mock("@/lib/transfer-portal", () => ({
  isTransferPortalEnabled: mockIsTransferPortalEnabled,
  getCachedSchoolTransfers: mockGetCachedSchoolTransfers,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ image }: { image: { alt?: string } }) => (
    <img alt={image.alt ?? ""} data-testid="school-logo" />
  ),
}));

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({
    title,
    slug,
    author,
  }: {
    title: string;
    slug: string;
    author?: string;
  }) => (
    <article data-testid="article-card">
      <a href={`/${slug}`}>{title}</a>
      {author ? <span>{author}</span> : null}
    </article>
  ),
  ArticleRow: ({ title, slug }: { title: string; slug: string }) => (
    <article data-testid="article-row">
      <a href={`/${slug}`}>{title}</a>
    </article>
  ),
}));

vi.mock("@/components/teams/team-connect-widget", () => ({
  TeamConnectWidget: ({ schoolName }: { schoolName: string }) => (
    <div data-testid="connect-widget">{schoolName}</div>
  ),
}));

vi.mock("@/components/teams/team-ranking-history", () => ({
  TeamRankingHistory: ({ teamName }: { teamName: string }) => (
    <div data-testid="ranking-history">{teamName}</div>
  ),
}));

vi.mock("@/components/teams/team-portal-moves", () => ({
  TeamPortalMoves: ({
    teamName,
    incoming,
    outgoing,
  }: {
    teamName: string;
    incoming: unknown[];
    outgoing: unknown[];
  }) => (
    <div data-testid="portal-moves">
      {teamName}: {incoming.length} in, {outgoing.length} out
    </div>
  ),
}));

import TeamPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/college/teams/[slug]/page";

const sampleSchool = {
  _id: "school-1",
  name: "Alabama Crimson Tide",
  shortName: "Alabama",
  nickname: "Crimson Tide",
  slug: "alabama",
  postCount: 10,
  image: null,
  socialLinks: {},
  overview: "Team overview",
};

function post(id: string, title: string) {
  return { _id: id, title, slug: id, authors: [{ name: "Reporter" }] };
}

const eightPosts = Array.from({ length: 8 }, (_, i) =>
  post(`post-${i}`, `Post ${i}`),
);

function mockTeamPageFetches(school: Record<string, unknown> = sampleSchool) {
  mockSanityFetchPage
    .mockResolvedValueOnce({ data: school })
    .mockResolvedValueOnce({ data: { posts: eightPosts } })
    .mockResolvedValueOnce({
      data: [post("recruit-1", "Top Recruit"), post("post-0", "Post 0")],
    });
}

async function renderTeamPage() {
  const page = await TeamPage({
    params: Promise.resolve({ slug: "alabama" }),
  });
  return render(page as ReactNode);
}

describe("TeamPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockSanityFetchStaticParams.mockReset();
    mockNotFound.mockClear();
    mockGetCachedSchoolRankingHistory.mockResolvedValue({ polls: [] });
    mockIsTransferPortalEnabled.mockReturnValue(false);
    mockGetCachedSchoolTransfers.mockReset();
  });

  it("generateStaticParams merges post-qualified and ranked slugs", async () => {
    mockSanityFetchStaticParams
      .mockResolvedValueOnce({ data: [{ slug: "alabama" }] })
      .mockResolvedValueOnce({ data: [{ slug: "georgia" }] });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue(["school-2"]);

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "alabama" },
      { slug: "georgia" },
    ]);
  });

  it("generateStaticParams skips ranked lookup when there are no ranked schools", async () => {
    mockSanityFetchStaticParams.mockResolvedValueOnce({
      data: [{ slug: "alabama" }],
    });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue([]);

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "alabama" },
    ]);
    expect(mockSanityFetchStaticParams).toHaveBeenCalledTimes(1);
  });

  it("generateStaticParams ignores null results and schools without slugs", async () => {
    mockSanityFetchStaticParams
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({
        data: [{ slug: null }, { slug: "georgia" }],
      });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue(["school-2"]);

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "georgia" },
    ]);
  });

  it("generateStaticParams treats null ranked slug payload as empty", async () => {
    mockSanityFetchStaticParams
      .mockResolvedValueOnce({ data: [{ slug: "alabama" }, { slug: null }] })
      .mockResolvedValueOnce({ data: null });
    mockGetCachedRankedSchoolSanityIds.mockResolvedValue(["school-2"]);

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "alabama" },
    ]);
  });

  it("generateMetadata throws notFound when school is ineligible", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: { ...sampleSchool, postCount: 1 },
    });
    mockGetCachedSchoolHasPollRankings.mockResolvedValue(false);

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "alabama" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders team page sections for eligible school", async () => {
    mockTeamPageFetches();

    await renderTeamPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Alabama Crimson Tide" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: "Alabama news" }),
    ).toBeInTheDocument();
    const cards = screen.getAllByTestId("article-card");
    expect(cards).toHaveLength(3);
    expect(within(cards[0]!).getByRole("link")).toHaveAttribute(
      "href",
      "/post-0",
    );
    expect(within(cards[0]!).getByText("Reporter")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: "More stories" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 2, name: "Alabama recruiting" }),
    ).toBeInTheDocument();
    // 5 "More stories" rows + 1 recruiting row (Post 0 is deduped).
    const rows = screen.getAllByTestId("article-row");
    expect(rows).toHaveLength(6);
    expect(rows.map((row) => row.textContent)).toEqual([
      "Post 3",
      "Post 4",
      "Post 5",
      "Post 6",
      "Post 7",
      "Top Recruit",
    ]);

    expect(screen.getByTestId("ranking-history")).toHaveTextContent("Alabama");
    expect(screen.getByTestId("connect-widget")).toHaveTextContent("Alabama");
    expect(screen.queryByTestId("portal-moves")).not.toBeInTheDocument();
    expect(mockGetCachedSchoolTransfers).not.toHaveBeenCalled();
  });

  it("renders conference badges for complete affiliations only", async () => {
    mockTeamPageFetches({
      ...sampleSchool,
      conferenceAffiliations: [
        {
          _key: "a1",
          conference: { shortName: "SEC", name: "Southeastern Conference" },
          sport: { title: "Football" },
        },
        {
          _key: "a2",
          conference: { shortName: null, name: "Big Sky Conference" },
          sport: { title: "Basketball" },
        },
        { _key: "a3", conference: null, sport: { title: "Baseball" } },
      ],
    });

    await renderTeamPage();

    expect(screen.getByText("SEC Football")).toBeInTheDocument();
    expect(
      screen.getByText("Big Sky Conference Basketball"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Baseball/)).not.toBeInTheDocument();
  });

  it("renders transfer portal moves when the portal is enabled", async () => {
    mockIsTransferPortalEnabled.mockReturnValue(true);
    mockGetCachedSchoolTransfers.mockResolvedValue({
      incoming: [{ id: "in-1" }, { id: "in-2" }],
      outgoing: [{ id: "out-1" }],
    });
    mockTeamPageFetches();

    await renderTeamPage();

    expect(mockGetCachedSchoolTransfers).toHaveBeenCalledWith("school-1");
    expect(screen.getByTestId("portal-moves")).toHaveTextContent(
      "Alabama: 2 in, 1 out",
    );
  });

  it("omits transfer portal moves when the school has no portal record", async () => {
    mockIsTransferPortalEnabled.mockReturnValue(true);
    mockGetCachedSchoolTransfers.mockResolvedValue(null);
    mockTeamPageFetches();

    await renderTeamPage();

    expect(screen.queryByTestId("portal-moves")).not.toBeInTheDocument();
  });

  it("throws notFound when school is missing", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });
    await expect(
      TeamPage({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("throws notFound when school is ineligible", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: { ...sampleSchool, postCount: 1 },
    });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({ polls: [] });

    await expect(
      TeamPage({ params: Promise.resolve({ slug: "alabama" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata returns metadata for eligible school", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: sampleSchool });
    mockGetCachedSchoolHasPollRankings.mockResolvedValue(true);
    await generateMetadata({ params: Promise.resolve({ slug: "alabama" }) });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "/college/teams/alabama" }),
      "published",
    );
  });

  it("generateMetadata throws notFound when school is missing", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata falls back to default description when SEO fields are missing", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: {
        ...sampleSchool,
        seoTitle: null,
        seoDescription: null,
        overview: null,
        nickname: null,
      },
    });
    mockGetCachedSchoolHasPollRankings.mockResolvedValue(true);
    await generateMetadata({ params: Promise.resolve({ slug: "alabama" }) });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining("Alabama Crimson Tide"),
      }),
      "published",
    );
  });

  it("generateMetadata uses name when shortName is missing for default title", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: {
        ...sampleSchool,
        shortName: null,
        nickname: "Crimson Tide",
        seoTitle: null,
      },
    });
    mockGetCachedSchoolHasPollRankings.mockResolvedValue(true);
    await generateMetadata({ params: Promise.resolve({ slug: "alabama" }) });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Alabama Crimson Tide"),
      }),
      "published",
    );
  });

  it("renders no logo when school has no image", async () => {
    mockTeamPageFetches();
    await renderTeamPage();
    expect(screen.queryByTestId("school-logo")).not.toBeInTheDocument();
  });

  it("renders school logo when image is present", async () => {
    mockTeamPageFetches({
      ...sampleSchool,
      image: { asset: { _ref: "image-1" }, alt: "Alabama" },
    });

    await renderTeamPage();

    expect(screen.getByTestId("school-logo")).toHaveAttribute("alt", "Alabama");
  });

  it("falls back to Team when shortName and name are missing", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          ...sampleSchool,
          shortName: null,
          name: null,
        },
      })
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: [] });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({
      polls: [{ pollId: "poll-1" }],
    });

    await renderTeamPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Crimson Tide" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ranking-history")).toHaveTextContent("Team");
    expect(screen.getByTestId("connect-widget")).toHaveTextContent("Team");
  });

  it("renders team page without news or recruiting sections when feeds are empty", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleSchool })
      .mockResolvedValueOnce({ data: { posts: [] } })
      .mockResolvedValueOnce({ data: [] });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({
      polls: [{ pollId: "poll-1" }],
    });

    await renderTeamPage();

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByTestId("article-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("article-row")).not.toBeInTheDocument();
    expect(screen.getByTestId("ranking-history")).toBeInTheDocument();
  });
});
