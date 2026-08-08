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
  mockGetPageMetadata: vi.fn(() => ({ title: "Sport News" })),
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
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  querySportsNews: "querySportsNews",
  sportInfoBySlug: "sportInfoBySlug",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
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

import SportNewsLoading from "@/app/college/[sport]/news/loading";
import SportNewsPage, {
  generateMetadata,
} from "@/app/college/[sport]/news/page";

describe("SportNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockNotFound.mockClear();
  });

  it("generateMetadata throws notFound when sport is missing", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    await expect(
      generateMetadata({
        params: Promise.resolve({ sport: "unknown" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata uses paginated title for page > 1", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: { title: "Football" } });
    await generateMetadata({
      params: Promise.resolve({ sport: "football" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Page 2"),
        slug: "/college/football/news?page=2",
      }),
      "published",
    );
  });

  it("generateMetadata uses first-page title when page is omitted", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: { title: "Football" } });
    await generateMetadata({
      params: Promise.resolve({ sport: "football" }),
      searchParams: Promise.resolve({}),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "College Football News & Updates",
        slug: "/college/football/news",
      }),
      "published",
    );
  });

  it("throws notFound when there are no posts", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: { posts: [], totalPosts: 0 } })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    await expect(
      SportNewsPage({
        params: Promise.resolve({ sport: "football" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders sport news feed", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ _id: "1", title: "Football Story" }],
          totalPosts: 1,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    const page = await SportNewsPage({
      params: Promise.resolve({ sport: "football" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "College Football News" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Football Story")).toBeInTheDocument();
  });

  it("renders pagination when multiple pages exist", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: Array.from({ length: 12 }, (_, i) => ({
            _id: String(i),
            title: `Story ${i}`,
          })),
          totalPosts: 24,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    const page = await SportNewsPage({
      params: Promise.resolve({ sport: "football" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });
});

describe("SportNewsLoading", () => {
  it("renders loading skeletons", () => {
    const { container } = render(<SportNewsLoading />);
    expect(container.firstChild).toBeTruthy();
  });
});
