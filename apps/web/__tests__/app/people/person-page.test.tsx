import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockRedirect,
  mockNotFound,
  mockGetCachedMostReadPosts,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Person" })),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockGetCachedMostReadPosts: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/draft-cache", () => ({
  searchParamsPage: (_fallback: unknown, render: () => Promise<unknown>) =>
    render(),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/most-read-data", () => ({
  getCachedMostReadPosts: mockGetCachedMostReadPosts,
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
  authorBySlug: "authorBySlug",
  postsByAuthor: "postsByAuthor",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
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

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
  IMAGE_SIZES: { articleCard: "144px" },
}));

vi.mock("@/components/most-read-card", () => ({
  MostReadCard: () => <div data-testid="most-read" />,
}));

vi.mock("@/components/news/archive-published-time", () => ({
  ArchivePublishedTime: ({ dateString }: { dateString: string }) => (
    <time>{dateString}</time>
  ),
}));

vi.mock("@/components/contact/site-social-buttons", () => ({
  SiteSocialButtons: () => <div data-testid="social-buttons" />,
}));

import PersonPage, { generateMetadata } from "@/app/people/[slug]/page";

const sampleAuthor = {
  name: "Jane Author",
  slug: "jane-author",
  roles: ["Senior Writer"],
  biography: "Covers college football.",
  image: { alt: "Jane" },
  socialLinks: { twitter: "https://twitter.com/jane" },
};

describe("PersonPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("generateMetadata calls notFound when author is missing", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    await expect(
      generateMetadata({
        params: Promise.resolve({ slug: "missing" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata uses /people canonical URLs", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: sampleAuthor });
    await generateMetadata({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "/people/jane-author?page=2",
      }),
      "published",
    );
  });

  it("generateMetadata ignores non-string page search params", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: sampleAuthor });
    await generateMetadata({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({ page: ["2"] }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "/people/jane-author",
      }),
      "published",
    );
  });

  it("generateMetadata ignores invalid page values", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: sampleAuthor });
    await generateMetadata({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({ page: "not-a-page" }),
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "/people/jane-author",
        title: expect.not.stringContaining("Page"),
      }),
      "published",
    );
  });

  it("redirects page=1 to canonical person URL", async () => {
    await expect(
      PersonPage({
        params: Promise.resolve({ slug: "jane-author" }),
        searchParams: Promise.resolve({ page: "1" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/people/jane-author");
  });

  it("renders json-ld when biography and social links are absent", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          ...sampleAuthor,
          biography: null,
          image: {},
          socialLinks: null,
        },
      })
      .mockResolvedValueOnce({ data: undefined });

    const page = await PersonPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
  });

  it("renders author profile and article list", async () => {
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
            },
          ],
          totalPosts: 1,
        },
      });

    const page = await PersonPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "Jane Author" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Covers college football.")).toBeInTheDocument();
    expect(screen.getByText("Latest Story")).toBeInTheDocument();
    expect(screen.getByTestId("social-buttons")).toBeInTheDocument();
  });

  it("calls notFound when author is missing at render time", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });
    await expect(
      PersonPage({
        params: Promise.resolve({ slug: "missing" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("maps nested post fields and drops posts without slugs", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleAuthor })
      .mockResolvedValueOnce({
        data: {
          posts: [
            { _id: "skip", title: "Skip", slug: "" },
            {
              _id: "rich",
              title: "Rich Story",
              slug: "rich-story",
              publishedAt: "2026-02-01",
              sport: { slug: "football", title: "Football" },
              division: { name: "FCS" },
              sportSubgrouping: { shortName: "SoCon", name: "Southern" },
              tags: [{ name: "News" }, "invalid", null],
              storyType: "feature",
            },
            {
              _id: "sparse",
              title: "Sparse Story",
              slug: "sparse-story",
              sport: { title: "Football" },
              division: "FCS",
              sportSubgrouping: null,
              tags: "not-array",
            },
            {
              _id: "nullish",
              title: "Nullish Story",
              slug: "nullish-story",
              sport: { slug: null, title: null },
              division: { name: null },
              sportSubgrouping: { shortName: null, name: null },
              tags: [{ name: null }],
            },
          ],
          totalPosts: 2,
        },
      });

    const page = await PersonPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(screen.getByText("Rich Story")).toBeInTheDocument();
    expect(screen.getByText("Sparse Story")).toBeInTheDocument();
    expect(screen.queryByText("Skip")).not.toBeInTheDocument();
  });

  it("renders staff layout when there are no posts", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({ data: sampleAuthor })
      .mockResolvedValueOnce({ data: { posts: [], totalPosts: 0 } });

    const page = await PersonPage({
      params: Promise.resolve({ slug: "jane-author" }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.queryByText("Latest Story")).not.toBeInTheDocument();
  });
});
