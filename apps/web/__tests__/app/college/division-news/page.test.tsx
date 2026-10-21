import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
  mockGetCachedMostReadPosts,
  mockGetCachedRankingsWidgetPolls,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Division News" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockGetCachedMostReadPosts: vi.fn().mockResolvedValue([]),
  mockGetCachedRankingsWidgetPolls: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: (
    _params: unknown,
    _fallback: unknown,
    render: (
      resolved: { sport: string; division: string },
      options: { perspective: string; stega: boolean },
    ) => Promise<unknown>,
  ) =>
    render(
      { sport: "football", division: "fbs" },
      { perspective: "published", stega: false },
    ),
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

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryDivisionOrSubgroupingDisplayName:
    "queryDivisionOrSubgroupingDisplayName",
  querySportsAndDivisionNews: "querySportsAndDivisionNews",
  querySportsAndDivisionNewsOldest: "querySportsAndDivisionNewsOldest",
  sportInfoBySlug: "sportInfoBySlug",
  globalNavigationQuery: "globalNavigationQuery",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/college/football/news/fbs",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data }: { data: Record<string, unknown> }) => (
    <script
      data-testid="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  ),
  organizationId: "org-id",
  websiteId: "website-id",
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

vi.mock("@/lib/news-archive/cached-nav-chrome", () => ({
  FolderConferencePickerSlot: () => <div data-testid="picker" />,
  FolderNewsFiltersBelowHeaderSlot: () => <div data-testid="filters" />,
}));

vi.mock("@/lib/news-archive/cached-sidebar", () => ({
  NewsArchiveSidebarSlot: () => <aside data-testid="sidebar" />,
}));

import DivisionNewsPage, {
  generateMetadata,
} from "@/app/college/[sport]/news/[division]/page";

function mockDivisionFetches(
  posts: Array<{
    _id: string;
    title: string;
    slug: string;
    publishedAt?: string;
  }>,
  totalPosts: number,
  divisionMeta: { displayName?: string; archiveKicker?: string } | null,
) {
  mockSanityFetchPage
    .mockResolvedValueOnce({
      data: { posts, totalPosts },
    })
    .mockResolvedValueOnce({ data: { title: "Football" } })
    .mockResolvedValueOnce({ data: divisionMeta });
}

describe("DivisionNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockNotFound.mockClear();
    mockGetCachedMostReadPosts.mockResolvedValue([]);
    mockGetCachedRankingsWidgetPolls.mockResolvedValue([]);
  });

  it("generateMetadata throws notFound when sport or division is missing", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: null });

    await expect(
      generateMetadata({
        params: Promise.resolve({ sport: "football", division: "fbs" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata uses paginated title for page > 1", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });
    await generateMetadata({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Page 2"),
      }),
      "published",
    );
  });

  it("generateMetadata uses first-page title when page is omitted", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });
    await generateMetadata({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
      searchParams: Promise.resolve({}),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "FBS Football News, Updates & Analysis",
        slug: "/college/football/news/fbs",
      }),
      "published",
    );
  });

  it("throws notFound when there are no posts", async () => {
    mockDivisionFetches([], 0, { displayName: "FBS" });

    await expect(
      DivisionNewsPage({
        params: Promise.resolve({ sport: "football", division: "fbs" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders division news feed", async () => {
    mockDivisionFetches(
      [
        {
          _id: "1",
          title: "FBS Story",
          slug: "fbs-story",
          publishedAt: "2026-01-01T12:00:00Z",
        },
      ],
      1,
      { displayName: "FBS" },
    );

    const page = await DivisionNewsPage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "FBS Football News" }),
    ).toBeInTheDocument();
    expect(screen.getByText("FBS Story")).toBeInTheDocument();
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
  });

  it("renders pagination when multiple pages exist", async () => {
    mockDivisionFetches(
      Array.from({ length: 12 }, (_, i) => ({
        _id: String(i),
        title: `Story ${i}`,
        slug: `story-${i}`,
        publishedAt: "2026-01-01T12:00:00Z",
      })),
      24,
      { displayName: "FBS" },
    );

    const page = await DivisionNewsPage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("falls back to the division slug in JSON-LD when displayName is missing", async () => {
    mockDivisionFetches(
      [
        {
          _id: "1",
          title: "FBS Story",
          slug: "fbs-story",
          publishedAt: "2026-01-01T12:00:00Z",
        },
      ],
      1,
      null,
    );

    const page = await DivisionNewsPage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    const jsonLd = screen.getByTestId("json-ld");
    const data = JSON.parse(jsonLd.innerHTML);
    const divisionCrumb = data.breadcrumb.itemListElement.find(
      (item: { position: number }) => item.position === 4,
    );
    expect(divisionCrumb.name).toBe("fbs");
  });
});
