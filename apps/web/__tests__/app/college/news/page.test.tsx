import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "College Sports News" })),
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
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  collegeNewsQuery: "collegeNewsQuery",
  querySportFilters: "querySportFilters",
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
  JsonLdScript: () => <script data-testid="json-ld" />,
  organizationId: "org-id",
  websiteId: "website-id",
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

vi.mock("@/components/news/filter-row", () => ({
  FilterRow: ({
    items,
  }: {
    items: Array<{ key: string; label: string; href: string }>;
  }) => (
    <nav aria-label="Filters">
      {items.map((item) => (
        <a key={item.key} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
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

import CollegeNewsPage, { generateMetadata } from "@/app/college/news/page";

const samplePost = {
  _id: "1",
  title: "College Headline",
  slug: "college-headline",
};

const sampleSports = [
  { _id: "sport-football", title: "Football", slug: "football" },
];

function mockFeed(feed: { posts: unknown[]; totalPosts: number }) {
  mockSanityFetchPage.mockImplementation(({ query }: { query: string }) =>
    Promise.resolve({
      data: query === "querySportFilters" ? sampleSports : feed,
    }),
  );
}

describe("CollegeNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockNotFound.mockClear();
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
        title: "College Sports News",
        slug: "/college/news",
      }),
      "published",
    );
  });

  it("throws notFound when there are no posts", async () => {
    mockFeed({ posts: [], totalPosts: 0 });
    await expect(
      CollegeNewsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders college news feed", async () => {
    mockFeed({ posts: [samplePost], totalPosts: 1 });

    const page = await CollegeNewsPage({ searchParams: Promise.resolve({}) });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "College Sports News" }),
    ).toBeInTheDocument();
    expect(screen.getByText("College Headline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute(
      "href",
      "/college/news",
    );
    expect(screen.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      "/college/football/news",
    );
  });

  it("renders only the All filter when sport filters are missing", async () => {
    mockSanityFetchPage.mockImplementation(({ query }: { query: string }) =>
      Promise.resolve({
        data:
          query === "querySportFilters"
            ? null
            : { posts: [samplePost], totalPosts: 1 },
      }),
    );

    const page = await CollegeNewsPage({ searchParams: Promise.resolve({}) });
    render(page as ReactNode);

    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "All" })).toBeInTheDocument();
  });

  it("falls back to an empty label for untitled sports", async () => {
    mockSanityFetchPage.mockImplementation(({ query }: { query: string }) =>
      Promise.resolve({
        data:
          query === "querySportFilters"
            ? [{ _id: "sport-x", title: null, slug: "untitled" }]
            : { posts: [samplePost], totalPosts: 1 },
      }),
    );

    const page = await CollegeNewsPage({ searchParams: Promise.resolve({}) });
    const { container } = render(page as ReactNode);

    const link = container.querySelector('a[href="/college/untitled/news"]');
    expect(link).toHaveTextContent(/^$/);
  });

  it("renders pagination when multiple pages exist", async () => {
    mockFeed({
      posts: Array.from({ length: 12 }, (_, i) => ({
        ...samplePost,
        _id: String(i),
        title: `Post ${i}`,
      })),
      totalPosts: 24,
    });

    const page = await CollegeNewsPage({
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);

    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });
});
