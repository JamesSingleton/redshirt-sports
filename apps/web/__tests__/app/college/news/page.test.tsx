import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
  mockGetCachedMostReadPosts,
  mockGetCachedRankingsWidgetPolls,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "College News" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockGetCachedMostReadPosts: vi.fn().mockResolvedValue([]),
  mockGetCachedRankingsWidgetPolls: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareSearchParamsPage: (
    _searchParams: unknown,
    _fallback: unknown,
    render: (
      filters: Record<string, string | undefined>,
      options: { perspective: string; stega: boolean },
    ) => Promise<unknown>,
  ) => render({}, { perspective: "published", stega: false }),
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
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryCollegeNews: "queryCollegeNews",
  queryCollegeNewsOldest: "queryCollegeNewsOldest",
  globalNavigationQuery: "globalNavigationQuery",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/college/news",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

import CollegeNewsLoading from "@/app/college/news/loading";
import CollegeNewsPage, { generateMetadata } from "@/app/college/news/page";

const samplePost = {
  _id: "1",
  title: "College Headline",
  slug: "college-headline",
  publishedAt: "2026-10-19T12:00:00.000Z",
  sportTitle: "College Football",
  sportSlug: "football",
};

describe("CollegeNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockNotFound.mockClear();
    mockGetCachedMostReadPosts.mockResolvedValue([]);
    mockGetCachedRankingsWidgetPolls.mockResolvedValue([]);
  });

  it("generateMetadata uses paginated title for page > 1", async () => {
    await generateMetadata({
      searchParams: Promise.resolve({ page: "2" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Page 2"),
        slug: "/college/news?page=2",
      }),
      "published",
    );
  });

  it("generateMetadata uses first-page title when page is omitted", async () => {
    await generateMetadata({
      searchParams: Promise.resolve({}),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "College News",
        slug: "/college/news",
      }),
      "published",
    );
  });

  it("throws notFound when there are no posts", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: { posts: [], totalPosts: 0 },
    });
    await expect(
      CollegeNewsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders college news archive", async () => {
    mockSanityFetchPage.mockImplementation(({ query }: { query: string }) => {
      if (query === "globalNavigationQuery") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({
        data: { posts: [samplePost], totalPosts: 1 },
      });
    });

    const page = await CollegeNewsPage({ searchParams: Promise.resolve({}) });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "College News" }),
    ).toBeInTheDocument();
    expect(screen.getByText("College Headline")).toBeInTheDocument();
    expect(screen.getByText("College Football")).toBeInTheDocument();
  });

  it("renders pagination when multiple pages exist", async () => {
    mockSanityFetchPage.mockImplementation(({ query }: { query: string }) => {
      if (query === "globalNavigationQuery") {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({
        data: {
          posts: Array.from({ length: 12 }, (_, i) => ({
            ...samplePost,
            _id: String(i),
            title: `Post ${i}`,
          })),
          totalPosts: 24,
        },
      });
    });

    const page = await CollegeNewsPage({
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);

    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("loading route renders archive skeleton", () => {
    render(<CollegeNewsLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
