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
  mockGetPageMetadata: vi.fn(() => ({ title: "Conference News" })),
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
      resolved: { sport: string; division: string; conference: string },
      options: { perspective: string; stega: boolean },
    ) => Promise<unknown>,
  ) =>
    render(
      { sport: "football", division: "fbs", conference: "sec" },
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
  conferenceInfoBySlugQuery: "conferenceInfoBySlugQuery",
  queryArticlesBySportDivisionAndConference:
    "queryArticlesBySportDivisionAndConference",
  queryArticlesBySportDivisionAndConferenceOldest:
    "queryArticlesBySportDivisionAndConferenceOldest",
  queryDivisionOrSubgroupingDisplayName:
    "queryDivisionOrSubgroupingDisplayName",
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
  usePathname: () => "/college/football/news/fbs/sec",
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

import ConferenceNewsPage, {
  generateMetadata,
} from "@/app/college/[sport]/news/[division]/[conference]/page";

function mockConferenceFetches(
  data: {
    posts: Array<{
      _id: string;
      title: string;
      slug: string;
      publishedAt?: string;
    }>;
    totalPosts: number;
    conferenceInfo: { name: string; shortName?: string | null } | null;
  },
  divisionMeta: { displayName?: string } | null,
) {
  mockSanityFetchPage
    .mockResolvedValueOnce({ data })
    .mockResolvedValueOnce({ data: { title: "Football" } })
    .mockResolvedValueOnce({ data: divisionMeta });
}

describe("ConferenceNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockNotFound.mockClear();
    mockGetCachedMostReadPosts.mockResolvedValue([]);
    mockGetCachedRankingsWidgetPolls.mockResolvedValue([]);
  });

  it("generateMetadata throws notFound when conference data is missing", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: { displayName: "FBS" } })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ data: { title: "Football" } });

    await expect(
      generateMetadata({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          conference: "sec",
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata uses paginated title for page > 1", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: { displayName: "FBS" } })
      .mockResolvedValueOnce({
        data: { shortName: "SEC", name: "Southeastern Conference" },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    await generateMetadata({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
      searchParams: Promise.resolve({ page: "2" }),
    });

    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Page 2"),
        slug: "/college/football/news/fbs/sec?page=2",
      }),
      "published",
    );
  });

  it("generateMetadata falls back to conference name when shortName is missing", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: { displayName: "FBS" } })
      .mockResolvedValueOnce({
        data: { shortName: null, name: "Southeastern Conference" },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    await generateMetadata({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
      searchParams: Promise.resolve({}),
    });

    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Southeastern Conference"),
      }),
      "published",
    );
  });

  it("throws notFound when there are no posts", async () => {
    mockConferenceFetches(
      { posts: [], totalPosts: 0, conferenceInfo: null },
      { displayName: "FBS" },
    );

    await expect(
      ConferenceNewsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          conference: "sec",
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("throws notFound when conference info is missing on render", async () => {
    mockConferenceFetches(
      {
        posts: [{ _id: "1", title: "SEC Story", slug: "sec-story" }],
        totalPosts: 1,
        conferenceInfo: null,
      },
      { displayName: "FBS" },
    );

    await expect(
      ConferenceNewsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          conference: "sec",
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders conference news feed", async () => {
    mockConferenceFetches(
      {
        posts: [
          {
            _id: "1",
            title: "SEC Story",
            slug: "sec-story",
            publishedAt: "2026-01-01T12:00:00Z",
          },
        ],
        totalPosts: 1,
        conferenceInfo: { name: "Southeastern Conference", shortName: "SEC" },
      },
      { displayName: "FBS" },
    );

    const page = await ConferenceNewsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "SEC Football News" }),
    ).toBeInTheDocument();
    expect(screen.getByText("SEC Story")).toBeInTheDocument();
  });

  it("uses conference name when shortName is missing", async () => {
    mockConferenceFetches(
      {
        posts: Array.from({ length: 12 }, (_, i) => ({
          _id: String(i),
          title: `Story ${i}`,
          slug: `story-${i}`,
          publishedAt: "2026-01-01T12:00:00Z",
        })),
        totalPosts: 24,
        conferenceInfo: {
          name: "Southeastern Conference",
          shortName: null,
        },
      },
      { displayName: "FBS" },
    );

    const page = await ConferenceNewsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", {
        name: "Southeastern Conference Football News",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("falls back to the division slug in JSON-LD when displayName is missing", async () => {
    mockConferenceFetches(
      {
        posts: [
          {
            _id: "1",
            title: "SEC Story",
            slug: "sec-story",
            publishedAt: "2026-01-01T12:00:00Z",
          },
        ],
        totalPosts: 1,
        conferenceInfo: { name: "Southeastern Conference", shortName: "SEC" },
      },
      null,
    );

    const page = await ConferenceNewsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
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
