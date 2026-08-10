import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockRedirect,
  mockNotFound,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Author" })),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
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
  authorBySlug: "authorBySlug",
  postsByAuthor: "postsByAuthor",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.xyz",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
  buildSafeImageUrl: () => "https://example.com/image.jpg",
  organizationId: "org-id",
  websiteId: "website-id",
}));

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="article-card">{title}</div>
  ),
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

vi.mock("@/components/icons", () => ({
  Facebook: () => <span />,
  Twitter: () => <span />,
  YouTubeIcon: () => <span />,
}));

import AuthorPage, { generateMetadata } from "@/app/authors/[slug]/page";

const sampleAuthor = {
  name: "Jane Author",
  roles: ["Senior Writer"],
  biography: "Covers college football.",
  image: { alt: "Jane" },
  socialLinks: { twitter: "https://twitter.com/jane" },
};

describe("AuthorPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("generateMetadata throws notFound when author is missing", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "missing" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata builds paginated title for page > 1", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: sampleAuthor });
    await generateMetadata({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Page 2"),
        slug: "/authors/jane-author?page=2",
      }),
      "published",
    );
  });

  it("generateMetadata keeps canonical when page is 1", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: sampleAuthor });
    await generateMetadata({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({ page: "1" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Jane Author - Senior Writer",
        slug: "/authors/jane-author",
      }),
      "published",
    );
  });

  it("generateMetadata ignores non-string page values", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: sampleAuthor });
    await generateMetadata({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({ page: 2 as unknown as string }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "/authors/jane-author",
      }),
      "published",
    );
  });

  it("redirects page=1 to canonical author URL", async () => {
    await expect(
      AuthorPage({
        params: Promise.resolve({ slug: "jane-author" }),
        searchParams: Promise.resolve({ page: "1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/authors/jane-author");
  });

  it("renders author profile and articles", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleAuthor })
      .mockResolvedValueOnce({
        data: {
          posts: [
            {
              _id: "post-1",
              title: "Latest Story",
              slug: "latest-story",
              image: null,
              publishedAt: "2026-01-01",
              authors: [{ name: "Jane Author" }],
            },
          ],
          totalPosts: 1,
        },
      });

    const page = await AuthorPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Jane Author" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Covers college football.")).toBeInTheDocument();
    expect(screen.getByText("Articles by Jane Author")).toBeInTheDocument();
    expect(screen.getByText("Latest Story")).toBeInTheDocument();
  });

  it("throws notFound when author is missing on render", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: { posts: [], totalPosts: 0 } });

    await expect(
      AuthorPage({
        params: Promise.resolve({ slug: "missing" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders author without articles section when there are no posts", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleAuthor })
      .mockResolvedValueOnce({ data: { posts: [], totalPosts: 0 } });

    const page = await AuthorPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Jane Author" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Articles by Jane Author"),
    ).not.toBeInTheDocument();
  });

  it("renders author when posts payload is null and biography/socialLinks are missing", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          ...sampleAuthor,
          biography: null,
          socialLinks: null,
        },
      })
      .mockResolvedValueOnce({ data: null });

    const page = await AuthorPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Jane Author" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Covers college football."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders facebook and youtube social links with pagination", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          ...sampleAuthor,
          socialLinks: {
            facebook: "https://facebook.com/jane",
            youtube: "https://youtube.com/jane",
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          posts: Array.from({ length: 12 }, (_, i) => ({
            _id: `post-${i}`,
            title: `Story ${i}`,
            slug: `story-${i}`,
            image: null,
            publishedAt: "2026-01-01",
            authors: [{ name: "Jane Author" }],
          })),
          totalPosts: 24,
        },
      });

    const page = await AuthorPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByText(/Follow Jane Author on Facebook/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Subscribe to Jane Author's YouTube channel/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });
});
