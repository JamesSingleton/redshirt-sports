import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockSanityFetchPage, mockGetDynamicFetchOptions, mockGetPageMetadata } =
  vi.hoisted(() => ({
    mockSanityFetchPage: vi.fn(),
    mockGetDynamicFetchOptions: vi
      .fn()
      .mockResolvedValue({ perspective: "published", stega: false }),
    mockGetPageMetadata: vi.fn(() => ({ title: "Search Results" })),
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
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  searchQuery: "searchQuery",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@/components/page-header", () => ({
  __esModule: true,
  default: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string | null;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
}));

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({ title, author }: { title: string; author: string }) => (
    <div data-testid="article-card">
      <span>{title}</span>
      <span data-testid="author">{author}</span>
    </div>
  ),
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

import SearchLoading from "@/app/search/loading";
import SearchPage, { generateMetadata } from "@/app/search/page";

describe("SearchPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
  });

  it("generateMetadata calls getPageMetadata with noIndex", async () => {
    await generateMetadata();
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "/search", noIndex: true }),
      "published",
    );
  });

  it("renders no results message without a query", async () => {
    const page = await SearchPage({
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Search Results" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("renders search results when query matches posts", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        posts: [
          {
            _id: "1",
            title: "Alabama Preview",
            publishedAt: "2026-01-01",
            image: null,
            slug: "alabama-preview",
            authors: [{ name: "Writer" }],
          },
        ],
        totalPosts: 1,
      },
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: "alabama" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByText('Search results for "alabama"'),
    ).toBeInTheDocument();
    expect(screen.getByText("Alabama Preview")).toBeInTheDocument();
    expect(screen.getByTestId("author")).toHaveTextContent("Writer");
  });

  it("falls back to empty author when post has no authors", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        posts: [
          {
            _id: "1",
            title: "No Author Story",
            publishedAt: "2026-01-01",
            image: null,
            slug: "no-author",
            authors: [],
          },
        ],
        totalPosts: 1,
      },
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: "story" }),
    });
    render(page as ReactNode);

    expect(screen.getByText("No Author Story")).toBeInTheDocument();
    expect(screen.getByTestId("author")).toHaveTextContent("");
  });

  it("renders pagination when search results span multiple pages", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        posts: Array.from({ length: 12 }, (_, i) => ({
          _id: String(i),
          title: `Result ${i}`,
          publishedAt: "2026-01-01",
          image: null,
          slug: `result-${i}`,
          authors: [{ name: "Writer" }],
        })),
        totalPosts: 24,
      },
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: "alabama", page: "2" }),
    });
    render(page as ReactNode);

    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });
});

describe("SearchLoading", () => {
  it("renders skeleton placeholders", () => {
    const { container } = render(<SearchLoading />);
    expect(
      container.querySelectorAll(".animate-pulse, [class*='skeleton']").length,
    ).toBeGreaterThan(0);
  });
});
