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
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
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
    children,
  }: {
    title: string;
    subtitle?: string | null;
    children?: ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </div>
  ),
}));

vi.mock("next/form", () => ({
  __esModule: true,
  default: ({
    action,
    children,
    ...props
  }: {
    action: string;
    children: ReactNode;
  }) => (
    <form action={action} {...props}>
      {children}
    </form>
  ),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({ title, author }: { title: string; author: string | null }) => (
    <div data-testid="article-card">
      <span>{title}</span>
      <span data-testid="author">{author}</span>
    </div>
  ),
  ArticleOverlayCard: ({ title }: { title: string }) => (
    <div data-testid="overlay-card">{title}</div>
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

  it("renders the search prompt without a query", async () => {
    const page = await SearchPage({
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(screen.getByRole("heading", { name: "Search" })).toBeInTheDocument();
    expect(
      screen.getByText("Search every story on Redshirt Sports."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search articles" }),
    ).toHaveValue("");
    expect(screen.getByRole("search")).toHaveAttribute("action", "/search");
    expect(mockSanityFetchPage).not.toHaveBeenCalled();
    expect(screen.queryByTestId("article-card")).not.toBeInTheDocument();
    expect(screen.queryByText(/No stories match/)).not.toBeInTheDocument();
  });

  it("renders an empty state when the query has no matches", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: { posts: [], totalPosts: 0 },
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: "zzz" }),
    });
    render(page as ReactNode);

    expect(screen.getByText('0 results for "zzz"')).toBeInTheDocument();
    expect(screen.getByText('No stories match "zzz"')).toBeInTheDocument();
    expect(
      screen.getByText("Try a team, conference, or player name instead."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse the latest news" }),
    ).toHaveAttribute("href", "/college/news");
    expect(
      screen.getByRole("searchbox", { name: "Search articles" }),
    ).toHaveValue("zzz");
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
            authors: [{ _id: "a1", name: "Writer" }],
          },
        ],
        totalPosts: 1,
      },
    });

    const page = await SearchPage({
      searchParams: Promise.resolve({ q: "alabama" }),
    });
    render(page as ReactNode);

    expect(mockSanityFetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "searchQuery",
        params: { q: "alabama", from: 0, to: 12 },
      }),
    );
    expect(screen.getByText('1 result for "alabama"')).toBeInTheDocument();
    expect(screen.getByText("Alabama Preview")).toBeInTheDocument();
    expect(screen.getByTestId("author")).toHaveTextContent("Writer");
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
    expect(screen.queryByText(/No stories match/)).not.toBeInTheDocument();
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

    expect(mockSanityFetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { q: "alabama", from: 12, to: 24 },
      }),
    );
    expect(screen.getByText('24 results for "alabama"')).toBeInTheDocument();
    expect(screen.getAllByTestId("article-card")).toHaveLength(12);
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
