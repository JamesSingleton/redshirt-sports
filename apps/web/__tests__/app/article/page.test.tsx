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
  queryPostPaths: "queryPostPaths",
  queryPostSlugData: "queryPostSlugData",
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

vi.mock("next-sanity", () => ({
  toPlainText: () => "word ".repeat(250),
}));

vi.mock("@/components/json-ld", () => ({
  PostPageJsonLd: () => <script data-testid="post-json-ld" />,
  buildSafeImageUrl: () => "https://example.com/image.jpg",
}));

vi.mock("@/components/article-card", () => ({
  ArticleImage: ({ id }: { id?: string }) => (
    <img alt="" data-testid="hero-image" data-id={id} />
  ),
  ArticleRow: ({ title, slug }: { title: string; slug: string | null }) => (
    <div data-testid="article-row">
      <a href={`/${slug}`}>{title}</a>
    </div>
  ),
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

vi.mock("@/components/posts/article-share", () => ({
  ArticleShare: ({ slug, title }: { slug: string; title: string }) => (
    <div data-testid="article-share" data-slug={slug} data-title={title} />
  ),
}));

vi.mock("@/components/posts/author", () => ({
  Byline: ({ authors }: { authors: { name: string }[] }) => (
    <div data-testid="byline">{authors.map((a) => a.name).join(", ")}</div>
  ),
}));

vi.mock("@/components/rankings/top25-card", () => ({
  DivisionTop25Card: ({ division }: { division: string }) => (
    <div data-testid="division-top25" data-division={division} />
  ),
  isPollDivision: (value: string) => ["fcs", "fbs", "d2", "d3"].includes(value),
  DivisionTop25CardSkeleton: () => <div data-testid="top25-skeleton" />,
}));

vi.mock("@/components/rich-text", () => ({
  RichText: () => <div data-testid="rich-text">Article body</div>,
}));

import PostPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/[slug]/page";

async function renderPost() {
  const page = await PostPage({
    params: Promise.resolve({ slug: "big-game-preview" }),
  });
  return render(page as ReactNode);
}

const samplePost = {
  _id: "post-1",
  title: "Big Game Preview",
  excerpt: "A look ahead at Saturday.",
  slug: "big-game-preview",
  publishedAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-01-02T00:00:00Z",
  body: [],
  image: { credit: "Getty" },
  authors: [{ name: "Reporter" }],
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

  it("generateStaticParams returns empty array when Sanity has no paths", async () => {
    mockSanityFetchStaticParams.mockResolvedValue({ data: null });
    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  it("renders article without topic links, related posts or a hero image", async () => {
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

    await renderPost();

    expect(
      screen.getByRole("heading", { level: 1, name: "Big Game Preview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A look ahead at Saturday.")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Article topics" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Articles you may like" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("hero-image")).not.toBeInTheDocument();
    expect(screen.queryByTestId("division-top25")).not.toBeInTheDocument();
  });

  it("renders article content with topic links, hero, byline, share and related posts", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: samplePost });

    await renderPost();

    expect(
      screen.getByRole("heading", { level: 1, name: "Big Game Preview" }),
    ).toBeInTheDocument();
    const topics = within(
      screen.getByRole("navigation", { name: "Article topics" }),
    );
    expect(topics.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      "/college/football/news",
    );
    expect(topics.getByRole("link", { name: "FBS" })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
    expect(topics.getByRole("link", { name: "SEC" })).toHaveAttribute(
      "href",
      "/college/football/news/fbs/sec",
    );
    expect(screen.getByTestId("byline")).toHaveTextContent("Reporter");
    expect(screen.getByTestId("article-share")).toHaveAttribute(
      "data-slug",
      "big-game-preview",
    );
    expect(screen.getByTestId("hero-image")).toHaveAttribute(
      "data-id",
      "post-1",
    );
    expect(screen.getByText("Getty")).toBeInTheDocument();
    expect(screen.getByTestId("rich-text")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Articles you may like" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Related Article" }),
    ).toHaveAttribute("href", "/related-article");
  });

  it("renders the subgrouping poll card for D1 football articles", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: samplePost });

    await renderPost();

    expect(screen.getByTestId("division-top25")).toHaveAttribute(
      "data-division",
      "fbs",
    );
  });

  it("renders the division poll card for non-D1 football articles", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: { name: "Division II", slug: "d2" },
        sportSubgrouping: null,
      },
    });

    await renderPost();

    expect(screen.getByTestId("division-top25")).toHaveAttribute(
      "data-division",
      "d2",
    );
  });

  it("omits the poll card for non-football articles", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        sport: {
          slug: "mens-basketball",
          title: "Men's Basketball",
          _id: "s2",
        },
      },
    });

    await renderPost();

    expect(screen.queryByTestId("division-top25")).not.toBeInTheDocument();
  });

  it("omits the poll card for divisions without a poll", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: { name: "NAIA", slug: "naia" },
        sportSubgrouping: null,
      },
    });

    await renderPost();

    expect(screen.queryByTestId("division-top25")).not.toBeInTheDocument();
  });

  it("renders non-D1 division links and conference links without shortName", async () => {
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
      },
    });

    await renderPost();

    expect(screen.getByRole("link", { name: "Division II" })).toHaveAttribute(
      "href",
      "/college/football/news/d2",
    );
    expect(
      screen.getByRole("link", { name: "Great American Conference" }),
    ).toHaveAttribute("href", "/college/football/news/d2/gac");
  });

  it("uses sportSubgrouping slug for D1 division links", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        conferences: [],
      },
    });

    await renderPost();

    expect(screen.getByRole("link", { name: "FBS" })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
  });

  it("renders only the sport link and no credit when division, conferences and credit are missing", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: null,
        conferences: null,
        image: { credit: null },
      },
    });

    await renderPost();

    const topics = within(
      screen.getByRole("navigation", { name: "Article topics" }),
    );
    expect(topics.getAllByRole("link")).toHaveLength(1);
    expect(topics.getByRole("link", { name: "Football" })).toBeInTheDocument();
    expect(screen.getByTestId("hero-image")).toBeInTheDocument();
    expect(screen.queryByText("Getty")).not.toBeInTheDocument();
  });

  it("links conferences through their division when there is no division or affiliation", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: null,
        sportSubgrouping: null,
        conferences: [
          {
            slug: "gliac",
            shortName: "GLIAC",
            name: "Great Lakes Intercollegiate Athletic Conference",
            division: { slug: "d2" },
            sportSubdivisionAffiliations: [],
          },
        ],
        relatedPosts: [],
      },
    });

    await renderPost();

    const topics = within(
      screen.getByRole("navigation", { name: "Article topics" }),
    );
    expect(topics.getAllByRole("link")).toHaveLength(2);
    expect(topics.getByRole("link", { name: "GLIAC" })).toHaveAttribute(
      "href",
      "/college/football/news/d2/gliac",
    );
  });

  it("skips Division I topic links that have no subgrouping", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: { name: "D1", slug: "d1" },
        sportSubgrouping: null,
        conferences: [
          {
            slug: "sec",
            shortName: "SEC",
            name: "Southeastern Conference",
            division: { name: "D1", slug: "d1" },
            sportSubdivisionAffiliations: [],
          },
        ],
        relatedPosts: [],
      },
    });

    await renderPost();

    const topics = within(
      screen.getByRole("navigation", { name: "Article topics" }),
    );
    expect(topics.getAllByRole("link")).toHaveLength(1);
    expect(topics.queryByRole("link", { name: "D1" })).not.toBeInTheDocument();
    expect(topics.queryByRole("link", { name: "SEC" })).not.toBeInTheDocument();
  });
});
