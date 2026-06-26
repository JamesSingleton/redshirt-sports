import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Mock } from "vitest";

import { CachedHomePage, generateMetadata } from "@/app/page";

const { mockSanityFetchPage, mockGetHomeFootballPolls } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockGetHomeFootballPolls: vi.fn().mockResolvedValue({ fbs: null, fcs: null }),
}));

const article = {
  _id: "1",
  title: "Test Article",
  slug: "test-article",
  image: null,
  authors: [{ name: "Test Author" }],
  publishedAt: "2026-01-01T00:00:00Z",
  storyType: "news",
};

function createArticles(count: number, idPrefix = "article") {
  return Array.from({ length: count }, (_, index) => ({
    ...article,
    _id: `${idPrefix}-${index + 1}`,
    title: `Test Article ${index + 1}`,
    slug: `test-article-${index + 1}`,
  }));
}

vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/home-rankings", () => ({
  getHomeFootballPolls: mockGetHomeFootballPolls,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryMegaboardArticles: "mock-megaboard",
  queryLatestArticles: "mock-latest",
  queryLatestCollegeSportsArticles: "mock-college",
  queryHomePostsByStoryType: "mock-story-type",
  queryHomepageTeamAuthors: "mock-authors",
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/home/megaboard", () => ({
  Megaboard: () => <div data-testid="megaboard" />,
}));

vi.mock("@/components/home/home-news-section", () => ({
  HomeNewsSection: ({ title }: { title: string }) => (
    <div data-testid="home-news-section">{title}</div>
  ),
}));

vi.mock("@/components/home/top25-widget", () => ({
  Top25Widget: () => <div data-testid="top25-widget" />,
}));

vi.mock("@/components/home/our-team-widget", () => ({
  OurTeamWidget: () => <div data-testid="our-team-widget" />,
}));

vi.mock("@/components/newsletter-form", () => ({
  NewsletterForm: () => <div data-testid="newsletter-form" />,
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => null,
  organizationId: "org-id",
  websiteId: "website-id",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "http://localhost",
}));

const { mockFetchGlobalSeoSettings, mockGetPageMetadata } = vi.hoisted(() => ({
  mockFetchGlobalSeoSettings: vi.fn().mockResolvedValue({
    siteTitle: "College Sports News",
    siteDescription: "Default site description from CMS.",
    siteBrand: "Redshirt Sports",
    defaultOpenGraphImage: "https://cdn.sanity.io/default-og.jpg",
  }),
  mockGetPageMetadata: vi.fn(() => ({})),
}));

vi.mock("@/lib/global-seo-settings", () => ({
  fetchGlobalSeoSettings: mockFetchGlobalSeoSettings,
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
}));

const mockFetch = mockSanityFetchPage as Mock;

function mockDefaultHomeFetches() {
  const megaboard = createArticles(5, "megaboard");
  const collegeSports = createArticles(12, "college");
  const recruiting = createArticles(6, "recruiting");
  const transfer = createArticles(6, "transfer");
  const fcs = createArticles(6, "fcs");
  const fbs = createArticles(6, "fbs");
  const d2 = createArticles(6, "d2");
  const d3 = createArticles(6, "d3");
  const midMajor = createArticles(6, "mid-major");

  mockFetch
    .mockResolvedValueOnce({ data: megaboard })
    .mockResolvedValueOnce({ data: collegeSports })
    .mockResolvedValueOnce({ data: recruiting })
    .mockResolvedValueOnce({ data: transfer })
    .mockResolvedValueOnce({ data: [] })
    .mockResolvedValueOnce({ data: fcs })
    .mockResolvedValueOnce({ data: fbs })
    .mockResolvedValueOnce({ data: d2 })
    .mockResolvedValueOnce({ data: d3 })
    .mockResolvedValueOnce({ data: midMajor });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockDefaultHomeFetches();
});

describe("HomePage", () => {
  it("generateMetadata passes homepage fields to getPageMetadata", async () => {
    await generateMetadata();

    expect(mockFetchGlobalSeoSettings).toHaveBeenCalledWith("published");
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      {
        title: "College Sports News",
        description: "Default site description from CMS.",
        slug: "/",
      },
      "published",
    );
  });

  it("renders the megaboard and main homepage sections", async () => {
    const page = await CachedHomePage({
      perspective: "published",
      stega: false,
    });
    render(page);

    expect(screen.getByTestId("megaboard")).toBeInTheDocument();
    expect(screen.getByText("College Sports")).toBeInTheDocument();
    expect(screen.getByText("Recruiting")).toBeInTheDocument();
    expect(screen.getByText("Transfer Portal")).toBeInTheDocument();
    expect(screen.getByText("Division I FCS Football")).toBeInTheDocument();
    expect(screen.getByText("Division I FBS Football")).toBeInTheDocument();
    expect(screen.getByText("Division II Football")).toBeInTheDocument();
    expect(screen.getByText("Division III Football")).toBeInTheDocument();
    expect(
      screen.getByText("Division I Mid-Major Men's Basketball"),
    ).toBeInTheDocument();
  });

  it("renders sidebar widgets", async () => {
    const page = await CachedHomePage({
      perspective: "published",
      stega: false,
    });
    render(page);

    expect(screen.getByTestId("top25-widget")).toBeInTheDocument();
    expect(screen.getByTestId("our-team-widget")).toBeInTheDocument();
    expect(screen.getByTestId("newsletter-form")).toBeInTheDocument();
    expect(screen.getByText("Advertisement")).toBeInTheDocument();
  });

  it("skips division sections when article data is missing", async () => {
    mockFetch.mockReset();
    const megaboard = createArticles(5, "megaboard");
    const collegeSports = createArticles(12, "college");
    const recruiting = createArticles(6, "recruiting");
    const transfer = createArticles(6, "transfer");
    const fbs = createArticles(6, "fbs");
    const d2 = createArticles(6, "d2");
    const d3 = createArticles(6, "d3");
    const midMajor = createArticles(6, "mid-major");

    mockFetch
      .mockResolvedValueOnce({ data: megaboard })
      .mockResolvedValueOnce({ data: collegeSports })
      .mockResolvedValueOnce({ data: recruiting })
      .mockResolvedValueOnce({ data: transfer })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: fbs })
      .mockResolvedValueOnce({ data: d2 })
      .mockResolvedValueOnce({ data: d3 })
      .mockResolvedValueOnce({ data: midMajor });

    const page = await CachedHomePage({
      perspective: "published",
      stega: false,
    });
    render(page);

    expect(
      screen.queryByText("Division I FCS Football"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId("home-news-section")).toHaveLength(7);
  });
});
