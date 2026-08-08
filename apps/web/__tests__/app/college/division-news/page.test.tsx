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
  searchParamsPage: (_fallback: unknown, render: () => Promise<unknown>) => render(),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryDivisionOrSubgroupingDisplayName: "queryDivisionOrSubgroupingDisplayName",
  querySportsAndDivisionNews: "querySportsAndDivisionNews",
  sportInfoBySlug: "sportInfoBySlug",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.xyz",
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
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/article-feed", () => ({
  __esModule: true,
  default: ({ articles }: { articles: Array<{ title: string }> }) => (
    <div data-testid="article-feed">
      {articles.map((a) => (
        <div key={a.title}>{a.title}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

import DivisionNewsPage, { generateMetadata } from "@/app/college/[sport]/news/[division]/page";

describe("DivisionNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
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
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const page = await DivisionNewsPage({
      params: Promise.resolve({ sport: "football", division: "fbs" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(screen.getByRole("heading", { name: "FBS Football News" })).toBeInTheDocument();
    expect(screen.getByText("FBS Story")).toBeInTheDocument();
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
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
});
