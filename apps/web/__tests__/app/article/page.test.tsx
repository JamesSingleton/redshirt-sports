import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockSanityFetchStaticParams,
  mockFetchGlobalSeoSettings,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
  mockGetCachedRankingsWidgetPolls,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockSanityFetchStaticParams: vi.fn(),
  mockFetchGlobalSeoSettings: vi.fn().mockResolvedValue({
    siteBrand: "Redshirt Sports",
    logo: null,
  }),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Article" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockGetCachedRankingsWidgetPolls: vi.fn().mockResolvedValue([]),
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

vi.mock("@/lib/rankings-widget-data", () => ({
  getCachedRankingsWidgetPolls: mockGetCachedRankingsWidgetPolls,
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
  queryPostPaths: "queryPostPaths",
  queryPostSlugData: "queryPostSlugData",
  queryActiveAdvertisement: "queryActiveAdvertisement",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  fetchGlobalSeoSettings: mockFetchGlobalSeoSettings,
  getPageMetadata: mockGetPageMetadata,
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

vi.mock("next-sanity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-sanity")>();
  return {
    ...actual,
    toPlainText: () => "word ".repeat(250),
  };
});

vi.mock("@redshirt-sports/sanity/client", () => ({
  urlFor: () => ({
    width: () => ({
      height: () => ({
        url: () => "https://example.com/avatar.jpg",
      }),
    }),
  }),
}));

vi.mock("@/components/json-ld", () => ({
  PostPageJsonLd: () => <script data-testid="post-json-ld" />,
  buildSafeImageUrl: () => "https://example.com/image.jpg",
}));

vi.mock("@/components/article-loading-skeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="article-skeleton" />,
}));

vi.mock("@/components/format-date", () => ({
  __esModule: true,
  default: ({ dateString }: { dateString: string }) => (
    <time>{dateString}</time>
  ),
}));

vi.mock("@/components/relative-time", () => ({
  RelativeTime: ({ dateString }: { dateString: string }) => (
    <span>{dateString}</span>
  ),
}));

vi.mock("@/components/posts/article-share", () => ({
  ArticleShareToolbar: () => <div data-testid="share-toolbar" />,
}));

vi.mock("@/components/rich-text", () => ({
  RichText: () => <div data-testid="rich-text">Article body</div>,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" data-testid="hero-image" />,
  IMAGE_SIZES: { articleHero: "100vw", articleCard: "192px" },
}));

vi.mock("@/components/ad-slot", () => ({
  AdSlot: () => <div data-testid="ad-slot" />,
}));

vi.mock("@/components/rankings-widget", () => ({
  RankingsWidget: () => <div data-testid="rankings-widget" />,
}));

vi.mock("@/components/article/more-from-author-card", () => ({
  MoreFromAuthorCard: () => <div data-testid="more-from-author" />,
}));

import PostPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/[slug]/page";

const samplePost = {
  title: "Big Game Preview",
  excerpt: "A look ahead at Saturday.",
  slug: "big-game-preview",
  publishedAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-01-02T00:00:00Z",
  body: [],
  image: { credit: "Getty" },
  authors: [{ name: "Reporter", slug: "reporter", archived: false }],
  tags: [],
  sport: { slug: "football", title: "Football", _id: "sport-1" },
  division: { name: "D1", slug: "d1" },
  sportSubgrouping: { slug: "fbs", shortName: "FBS" },
  conferences: [
    {
      slug: "sec",
      shortName: "SEC",
      name: "Southeastern Conference",
      division: { slug: "d1" },
      sportSubdivisionAffiliations: [
        { sport: { _id: "sport-1" }, subgrouping: { slug: "fbs" } },
      ],
    },
  ],
  relatedPosts: [
    {
      _id: "related-1",
      title: "Related Article",
      publishedAt: "2026-01-01",
      image: null,
      slug: "related-article",
      authors: [{ name: "Reporter" }],
    },
  ],
};

describe("PostPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockSanityFetchStaticParams.mockReset();
    mockNotFound.mockClear();
    mockGetCachedRankingsWidgetPolls.mockResolvedValue([
      { id: "poll-1", label: "FBS" },
    ]);
  });

  it("generateStaticParams maps slugs from Sanity", async () => {
    mockSanityFetchStaticParams.mockResolvedValue({
      data: [{ slug: "one" }, { slug: "two" }],
    });
    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "one" },
      { slug: "two" },
    ]);
  });

  it("generateMetadata throws notFound when post is missing", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata builds article metadata when post exists", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: samplePost });
    await generateMetadata({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Big Game Preview",
        ogType: "article",
      }),
      "published",
    );
  });

  it("generateMetadata coerces null SEO fields to undefined", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
      data: {
        ...samplePost,
        seoTitle: null,
        seoDescription: null,
        ogTitle: null,
        ogDescription: null,
        seoImage: null,
        image: null,
        excerpt: null,
        slug: null,
        publishedAt: null,
        _updatedAt: null,
      },
    });
    await generateMetadata({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        seoTitle: undefined,
        seoDescription: undefined,
        ogTitle: undefined,
        ogDescription: undefined,
        seoImage: undefined,
        image: undefined,
        description: undefined,
        slug: undefined,
        publishedTime: undefined,
        modifiedTime: undefined,
      }),
      "published",
    );
  });

  it("throws notFound when post data is missing on render", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });
    await expect(
      PostPage({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders article without sport context or related block", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        sport: null,
        division: null,
        conferences: null,
        relatedPosts: [],
        image: null,
      },
    });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Big Game Preview" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Articles you might also like"),
    ).not.toBeInTheDocument();
    expect(mockGetCachedRankingsWidgetPolls).not.toHaveBeenCalled();
  });

  it("renders article with breadcrumbs, photo credit, and related articles", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: samplePost });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Big Game Preview" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: "College Football" }),
    ).toHaveAttribute("href", "/college/football/news");
    expect(
      screen.getByLabelText("Articles you might also like"),
    ).toBeInTheDocument();
    expect(screen.getByText("Related Article")).toBeInTheDocument();
    expect(screen.getByText("Photo: Getty")).toBeInTheDocument();
    expect(mockGetCachedRankingsWidgetPolls).toHaveBeenCalledWith("football");
  });

  it("generateStaticParams returns empty array when Sanity has no paths", async () => {
    mockSanityFetchStaticParams.mockResolvedValue({ data: null });
    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  it("renders division breadcrumb and in-this-story teams for non-D1", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: { name: "Division II", slug: "d2" },
        sportSubgrouping: null,
        conferences: [
          {
            slug: "gac",
            shortName: null,
            name: "Great American Conference",
            division: { slug: "d2" },
            sportSubdivisionAffiliations: null,
          },
        ],
        relatedPosts: [],
        teams: [
          {
            _id: "team-1",
            name: "Henderson State",
            shortName: "Henderson State",
            nickname: "Reddies",
            slug: "henderson-state-reddies",
            image: null,
          },
        ],
      },
    });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: "Division II" }),
    ).toHaveAttribute("href", "/college/football/news/d2");
    expect(
      within(breadcrumb).getByRole("link", {
        name: "Great American Conference",
      }),
    ).toHaveAttribute("href", "/college/football/news/d2/gac");
    expect(
      screen.getByLabelText("Schools tagged on this article"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Henderson State Reddies/i }),
    ).toHaveAttribute("href", "/college/teams/henderson-state-reddies");
  });

  it("includes FBS in breadcrumbs for D1 football", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        conferences: [],
      },
    });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: "FBS" }),
    ).toHaveAttribute("href", "/college/football/news/fbs");
  });

  it("renders hero without photo credit when credit is missing", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: null,
        conferences: null,
        image: { credit: null },
        relatedPosts: [],
      },
    });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    expect(
      screen.getAllByRole("link", { name: "College Football" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("hero-image")).toBeInTheDocument();
    expect(screen.queryByText(/Photo:/)).not.toBeInTheDocument();
  });

  it("renders conference in breadcrumb when sport has conferences but no division", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: null,
        sportSubgrouping: null,
        relatedPosts: [],
      },
    });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: "SEC" }),
    ).toHaveAttribute("href", "/college/football/news/fbs/sec");
  });
});
