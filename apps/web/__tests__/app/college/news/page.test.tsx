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
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  collegeNewsQuery: "collegeNewsQuery",
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

import CollegeNewsPage, { generateMetadata } from "@/app/college/news/page";

const samplePost = {
  _id: "1",
  title: "College Headline",
  slug: "college-headline",
};

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
    mockSanityFetchPage.mockResolvedValue({
      data: { posts: [], totalPosts: 0 },
    });
    await expect(
      CollegeNewsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders college news feed", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: { posts: [samplePost], totalPosts: 1 },
    });

    const page = await CollegeNewsPage({ searchParams: Promise.resolve({}) });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "College Sports News" }),
    ).toBeInTheDocument();
    expect(screen.getByText("College Headline")).toBeInTheDocument();
  });

  it("renders pagination when multiple pages exist", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        posts: Array.from({ length: 12 }, (_, i) => ({
          ...samplePost,
          _id: String(i),
          title: `Post ${i}`,
        })),
        totalPosts: 24,
      },
    });

    const page = await CollegeNewsPage({
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);

    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });
});
