import { render, screen } from "@testing-library/react";
import { isValidElement, type ReactElement, Suspense } from "react";
import type { Mock } from "vitest";

import HomeRouteLoading from "@/app/home-route-loading";
import HomePage, { CachedHomePage, generateMetadata } from "@/app/page";

const { mockSanityFetchPage, mockGetDynamicFetchOptions } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockGetDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
}));

const mockGetCachedMostReadPosts = vi.hoisted(() =>
  vi.fn().mockResolvedValue([]),
);
const mockGetCachedRankingsWidgetPolls = vi.hoisted(() =>
  vi.fn().mockResolvedValue([]),
);

vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/most-read-data", () => ({
  getCachedMostReadPosts: mockGetCachedMostReadPosts,
}));

vi.mock("@/lib/rankings-widget-data", () => ({
  getCachedRankingsWidgetPolls: mockGetCachedRankingsWidgetPolls,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryHomeFeed: "mock-home-feed",
}));

vi.mock("@/components/home/home-page-content", () => ({
  HomePageContent: ({
    posts,
    mostRead,
    rankingsPolls,
  }: {
    posts: { title: string }[];
    mostRead: unknown[];
    rankingsPolls: unknown[];
  }) => (
    <div data-testid="home-page-content">
      <span data-testid="post-count">{posts.length}</span>
      <span data-testid="most-read-count">{mostRead.length}</span>
      <span data-testid="rankings-poll-count">{rankingsPolls.length}</span>
      {posts[0]?.title ? <span>{posts[0].title}</span> : null}
    </div>
  ),
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data }: { data: Record<string, unknown> }) => (
    <script
      data-testid="home-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  ),
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
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

const mockFetch = mockSanityFetchPage as Mock;

beforeEach(() => {
  mockFetch.mockResolvedValue({ data: [] });
  mockGetCachedMostReadPosts.mockResolvedValue([]);
  mockGetCachedRankingsWidgetPolls.mockResolvedValue([]);
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

  it("renders home page content with feed and rail data", async () => {
    const article = {
      _id: "1",
      title: "Test Article",
      publishedAt: "2026-01-01T00:00:00Z",
      slug: "test-article",
    };

    mockFetch.mockResolvedValueOnce({ data: [article] });
    mockGetCachedMostReadPosts.mockResolvedValueOnce([
      { title: "Popular", slug: "popular", href: "/p" },
    ]);
    mockGetCachedRankingsWidgetPolls.mockResolvedValueOnce([
      { division: "fcs", label: "FCS" },
    ]);

    const page = await CachedHomePage({
      perspective: "published",
      stega: false,
    });
    render(page);

    expect(screen.getByTestId("home-page-content")).toBeInTheDocument();
    expect(screen.getByTestId("post-count")).toHaveTextContent("1");
    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getByTestId("most-read-count")).toHaveTextContent("1");
    expect(screen.getByTestId("rankings-poll-count")).toHaveTextContent("1");
  });

  it("default export wraps CachedHomePage in draftAware Suspense", () => {
    const page = HomePage();
    expect(page).toBeTruthy();
    expect(mockGetDynamicFetchOptions).not.toHaveBeenCalled();
  });

  it("uses the home route loading UI as the nearest Suspense fallback", () => {
    const tree = HomePage();
    expect(isValidElement(tree)).toBe(true);
    expect(tree.type).toBe(Suspense);
    const fallback = (tree as ReactElement<{ fallback: ReactElement }>).props
      .fallback;
    expect(isValidElement(fallback)).toBe(true);
    expect(fallback.type).toBe(HomeRouteLoading);
  });

  it("uses the current date in JSON-LD when the home feed is empty", async () => {
    mockFetch.mockResolvedValueOnce({ data: null });

    const page = await CachedHomePage({
      perspective: "published",
      stega: false,
    });
    render(page);

    const jsonLd = screen.getByTestId("home-json-ld");
    const data = JSON.parse(jsonLd.innerHTML);
    expect(data.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("falls back to app name and undefined description when SEO settings are missing", async () => {
    const previousAppName = process.env.NEXT_PUBLIC_APP_NAME;
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports Fallback";
    mockFetchGlobalSeoSettings.mockResolvedValueOnce(null);

    const page = await CachedHomePage({
      perspective: "published",
      stega: false,
    });
    render(page);

    const jsonLd = screen.getByTestId("home-json-ld");
    const data = JSON.parse(jsonLd.innerHTML);
    expect(data.name).toBe("Redshirt Sports Fallback");
    expect(data.description).toBeUndefined();

    process.env.NEXT_PUBLIC_APP_NAME = previousAppName;
  });
});
