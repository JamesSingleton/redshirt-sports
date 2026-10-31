import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockSanityFetchStaticParams,
  mockGetCachedRankedSchoolSanityIds,
  mockGetCachedSchoolRankingHistory,
  mockGetCachedSchoolHasPollRankings,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockSanityFetchStaticParams: vi.fn(),
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
  MIN_TEAM_PAGE_POSTS: 1,
  TEAM_PAGE_NEWS_FETCH_SIZE: 8,
  postsBySchoolQuery: "postsBySchoolQuery",
  querySchoolPaths: "querySchoolPaths",
  schoolBySlugQuery: "schoolBySlugQuery",
  schoolSlugsByIdsQuery: "schoolSlugsByIdsQuery",
  queryActiveAdvertisement: "queryActiveAdvertisement",
}));

vi.mock("@/lib/global-seo-settings", () => ({
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

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

vi.mock("@/components/teams/team-poll-rank-inline", () => ({
  TeamPollRankInline: () => <div data-testid="football-rank-inline" />,
}));

vi.mock("@/components/teams/team-post-card", () => ({
  TeamFeaturedArticle: ({ post }: { post: { title: string } }) => (
    <div data-testid="featured">{post.title}</div>
  ),
  TeamNewsItem: ({ post }: { post: { title: string } }) => (
    <div data-testid="news-item">{post.title}</div>
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

function mockTeamPageFetches() {
  mockSanityFetchPage
    .mockResolvedValueOnce({ data: sampleSchool })
    .mockResolvedValueOnce({
      data: {
        posts: Array.from({ length: 8 }, (_, i) => ({
          _id: `post-${i}`,
          title: `Post ${i}`,
          sport: { slug: "football", title: "Football" },
        })),
      },
    });
}

describe("TeamPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockSanityFetchStaticParams.mockReset();
    mockNotFound.mockClear();
    mockGetCachedSchoolRankingHistory.mockResolvedValue({ polls: [] });
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
      data: { ...sampleSchool, postCount: 0 },
    });
    mockGetCachedSchoolHasPollRankings.mockResolvedValue(false);

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "alabama" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders team page sections for eligible school", async () => {
    mockTeamPageFetches();

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", {
        name: "Alabama Crimson Tide",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("featured")).toHaveTextContent("Post 0");
    expect(screen.getByRole("heading", { name: "Football", level: 2 }));
    expect(screen.getAllByTestId("news-item").length).toBeGreaterThan(0);
  });

  it("passes unique conference sport slugs to the team sidebar sponsorship", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          ...sampleSchool,
          conferenceAffiliations: [
            { sport: { slug: "football" } },
            { sport: { slug: "football" } },
            { sport: { slug: "basketball" } },
            { sport: null },
            { sport: { slug: "" } },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { posts: [] } });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({
      polls: [{ pollId: "poll-1" }],
    });

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    render(page as ReactNode);

    expect(mockSanityFetchPage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        query: "queryActiveAdvertisement",
        params: expect.objectContaining({
          placement: "team-sidebar",
          sportSlugs: ["football", "basketball"],
        }),
      }),
    );
  });

  it("throws notFound when school is missing", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });
    await expect(
      TeamPage({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("throws notFound when school is ineligible", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: { ...sampleSchool, postCount: 0 },
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

  it("renders placeholder nav image when school has no logo", async () => {
    mockTeamPageFetches();
    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    const { container } = render(page as ReactNode);
    expect(container.querySelector(".rounded-full.bg-muted")).toBeTruthy();
  });

  it("renders school logo when image is present", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          ...sampleSchool,
          image: { asset: { _ref: "image-1" }, alt: "Alabama" },
        },
      })
      .mockResolvedValueOnce({
        data: {
          posts: Array.from({ length: 8 }, (_, i) => ({
            _id: `post-${i}`,
            title: `Post ${i}`,
            sport: { slug: "football", title: "Football" },
          })),
        },
      });

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    const { container } = render(page as ReactNode);
    expect(container.querySelector("img")).toBeTruthy();
    expect(container.querySelector(".rounded-full.bg-muted")).toBeNull();
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
      .mockResolvedValueOnce({ data: { posts: [] } });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({
      polls: [{ pollId: "poll-1", sportSlug: "football", pollSlug: "fcs" }],
    });

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Team Crimson Tide", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest", level: 2 }));
  });

  it("treats a null news payload as an empty post list", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleSchool })
      .mockResolvedValueOnce({ data: null });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({ polls: [] });

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    render(page as ReactNode);

    expect(screen.getByText("No recent stories yet.")).toBeInTheDocument();
  });

  it("renders team page without posts when news feed is empty", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleSchool })
      .mockResolvedValueOnce({ data: { posts: [] } });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({
      polls: [
        {
          pollId: "poll-1",
          sportSlug: "football",
          pollSlug: "fcs",
          pollName: "FCS",
          years: [2025],
          seriesByYear: {},
        },
      ],
    });

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    render(page as ReactNode);

    expect(screen.getByText("No recent stories yet.")).toBeInTheDocument();
    expect(screen.queryByTestId("featured")).not.toBeInTheDocument();
    expect(screen.getByTestId("football-rank-inline")).toBeInTheDocument();
  });
});
