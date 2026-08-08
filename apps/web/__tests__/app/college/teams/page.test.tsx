import { render, screen } from "@testing-library/react";
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

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

vi.mock("@/components/teams/team-connect-widget", () => ({
  TeamConnectWidget: () => <div data-testid="connect-widget" />,
}));

vi.mock("@/components/teams/team-feed-list", () => ({
  TeamFeedList: ({ title }: { title: string }) => <section>{title}</section>,
}));

vi.mock("@/components/teams/team-post-card", () => ({
  TeamFeaturedArticle: ({ post }: { post: { title: string } }) => (
    <div data-testid="featured">{post.title}</div>
  ),
  TeamNewsItem: ({ post }: { post: { title: string } }) => (
    <div data-testid="news-item">{post.title}</div>
  ),
}));

vi.mock("@/components/teams/team-ranking-history", () => ({
  TeamRankingHistory: () => <div data-testid="ranking-history" />,
}));

import TeamPage, { generateMetadata, generateStaticParams } from "@/app/college/teams/[slug]/page";

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
        })),
      },
    })
    .mockResolvedValueOnce({
      data: [{ _id: "recruit-1", title: "Top Recruit" }],
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

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    render(page as ReactNode);

    expect(screen.getByRole("heading", { name: "Alabama" })).toBeInTheDocument();
    expect(screen.getByText("Post 0")).toBeInTheDocument();
    expect(screen.getByText("Alabama Sports")).toBeInTheDocument();
    expect(screen.getByText("Top Recruit")).toBeInTheDocument();
    expect(screen.getByTestId("connect-widget")).toBeInTheDocument();
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

  it("renders placeholder nav image when school has no logo", async () => {
    mockTeamPageFetches();
    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    const { container } = render(page as ReactNode);
    expect(container.querySelector(".rounded-full.bg-muted")).toBeTruthy();
  });

  it("renders team page without featured posts or recruiting when feeds are empty", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleSchool })
      .mockResolvedValueOnce({ data: { posts: [] } })
      .mockResolvedValueOnce({ data: [] });
    mockGetCachedSchoolRankingHistory.mockResolvedValue({
      polls: [{ pollId: "poll-1" }],
    });

    const page = await TeamPage({
      params: Promise.resolve({ slug: "alabama" }),
    });
    render(page as ReactNode);

    expect(screen.getByText("Alabama Sports")).toBeInTheDocument();
    expect(screen.queryByTestId("featured")).not.toBeInTheDocument();
    expect(screen.queryByText("Alabama Recruiting")).not.toBeInTheDocument();
  });
});
