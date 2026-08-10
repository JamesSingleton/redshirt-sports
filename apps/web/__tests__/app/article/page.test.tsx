import { render, screen } from "@testing-library/react";
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
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="article-card">{title}</div>
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
  LargeArticleSocialShare: () => <div data-testid="social-share" />,
}));

vi.mock("@/components/posts/author", () => ({
  AuthorSection: () => <div data-testid="author-section" />,
  MobileAuthorSection: () => <div data-testid="mobile-author" />,
}));

vi.mock("@/components/rich-text", () => ({
  RichText: () => <div data-testid="rich-text">Article body</div>,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" data-testid="hero-image" />,
  IMAGE_SIZES: { articleHero: "100vw" },
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

  it("renders article without sport badges or related posts", async () => {
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
    expect(screen.queryByText("You Might Also Like")).not.toBeInTheDocument();
  });

  it("renders article content with sport badges and related posts", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: samplePost });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Big Game Preview" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      "/college/football/news",
    );
    expect(screen.getByText("You Might Also Like")).toBeInTheDocument();
    expect(screen.getByText("Source: Getty")).toBeInTheDocument();
  });

  it("generateStaticParams returns empty array when Sanity has no paths", async () => {
    mockSanityFetchStaticParams.mockResolvedValue({ data: null });
    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  it("renders non-D1 division badges and conference links without shortName", async () => {
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

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    expect(screen.getByRole("link", { name: "Division II" })).toHaveAttribute(
      "href",
      "/college/football/news/d2",
    );
    expect(
      screen.getByRole("link", { name: "Great American Conference" }),
    ).toHaveAttribute("href", "/college/football/news/d2/gac");
  });

  it("uses sportSubgrouping slug for D1 division badges", async () => {
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

    expect(screen.getByRole("link", { name: "FBS" })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
  });

  it("renders sport badge with only sportSubgrouping and no bullet without division/conferences", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        ...samplePost,
        division: null,
        conferences: null,
        image: { credit: null },
      },
    });

    const page = await PostPage({
      params: Promise.resolve({ slug: "big-game-preview" }),
    });
    render(page as ReactNode);

    expect(screen.getByRole("link", { name: "Football" })).toBeInTheDocument();
    expect(screen.getByTestId("hero-image")).toBeInTheDocument();
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument();
    expect(screen.queryByText("•")).not.toBeInTheDocument();
  });

  it("renders bullet separator when sport has conferences but no division", async () => {
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

    expect(screen.getByText("•")).toBeInTheDocument();
  });
});
