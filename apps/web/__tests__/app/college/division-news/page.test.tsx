import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
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
}));

vi.mock("@/lib/draft-cache", () => ({
  searchParamsPage: (_fallback: unknown, render: () => Promise<unknown>) =>
    render(),
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
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryDivisionConferenceFilters: "queryDivisionConferenceFilters",
  queryDivisionOrSubgroupingDisplayName:
    "queryDivisionOrSubgroupingDisplayName",
  querySportsAndDivisionNews: "querySportsAndDivisionNews",
  sportInfoBySlug: "sportInfoBySlug",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
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

vi.mock("@/components/filter-combobox", () => ({
  RouteFilterCombobox: ({
    items,
    activeHref,
  }: {
    items: Array<{ label: string; href: string; keywords?: string }>;
    activeHref?: string;
  }) => (
    <div
      data-testid="conference-filter"
      data-active={activeHref}
      data-items={JSON.stringify(items)}
    />
  ),
}));

vi.mock("@/components/page-header", () => ({
  __esModule: true,
  default: ({ title, children }: { title: string; children?: ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/components/page-transition", () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/rankings/poll-aside", () => ({
  PollAside: () => null,
}));

vi.mock("@/components/news/news-listing", () => ({
  NewsListing: {
    Layout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Feed: ({
      posts,
      totalPosts,
    }: {
      posts: Array<{ _id: string; title: string }>;
      totalPosts: number;
    }) => (
      <div data-testid="article-feed">
        {posts.map((post) => (
          <div key={post._id}>{post.title}</div>
        ))}
        {totalPosts > posts.length ? <nav data-testid="pagination" /> : null}
      </div>
    ),
  },
}));

import DivisionNewsPage, {
  generateMetadata,
} from "@/app/college/[sport]/news/[division]/page";

describe("DivisionNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchPage.mockResolvedValue({ data: null });
    mockSanityFetchMetadata.mockReset();
    mockNotFound.mockClear();
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
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: { posts: [], totalPosts: 0 } })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    await expect(
      DivisionNewsPage({
        params: Promise.resolve({ sport: "football", division: "fbs" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders division news feed", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ _id: "1", title: "FBS Story", slug: "fbs-story" }],
          totalPosts: 1,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } })
      .mockResolvedValueOnce({
        data: [
          {
            _id: "sec",
            name: "SEC",
            fullName: "Southeastern Conference",
            slug: "sec",
          },
        ],
      });

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

    const filter = screen.getByTestId("conference-filter");
    expect(filter).toHaveAttribute("data-active", "/college/football/news/fbs");
    expect(JSON.parse(filter.getAttribute("data-items") ?? "[]")).toEqual([
      {
        key: "all",
        label: "All conferences",
        href: "/college/football/news/fbs",
      },
      {
        key: "sec",
        label: "SEC",
        keywords: "Southeastern Conference",
        href: "/college/football/news/fbs/sec",
      },
    ]);
  });

  it("renders pagination when multiple pages exist", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: Array.from({ length: 12 }, (_, i) => ({
            _id: String(i),
            title: `Story ${i}`,
            slug: `story-${i}`,
          })),
          totalPosts: 24,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const page = await DivisionNewsPage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("falls back to empty division title in JSON-LD when displayName is missing", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ _id: "1", title: "FBS Story", slug: "fbs-story" }],
          totalPosts: 1,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: null });

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
    expect(divisionCrumb.name).toBe("");
  });
});
