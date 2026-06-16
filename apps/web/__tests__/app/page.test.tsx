import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Mock } from "vitest";

import HomePage, { generateMetadata } from "@/app/page";

const { mockSanityFetchPage } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
}));

vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({ isEnabled: false }),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwarePage: async (
    _fallback: ReactNode,
    render: (options: {
      perspective: string;
      stega: boolean;
    }) => Promise<ReactNode>,
  ) => render({ perspective: "published", stega: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryHomePageData: "mock-home",
  queryLatestArticles: "mock-latest",
  queryLatestCollegeSportsArticles: "mock-college",
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/home/hero", () => ({
  __esModule: true,
  default: () => <div data-testid="hero" />,
}));

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="article-card">{title}</div>
  ),
}));

vi.mock("@/components/article-section", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <div data-testid="article-section">{title}</div>
  ),
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => null,
  organizationId: "org-id",
  websiteId: "website-id",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "http://localhost",
}));

const { mockFetchGlobalSeoSettings, mockGetPageMetadata } = vi.hoisted(() => ({
  mockFetchGlobalSeoSettings: vi.fn().mockResolvedValue({
    siteTitle: "College Sports News",
    siteDescription: "Default site description from CMS.",
    siteBrand: "Redshirt Sports",
    defaultOpenGraphImage: "https://cdn.sanity.io/default-og.jpg",
  }),
  mockGetPageMetadata: vi.fn(() => ({})),
}));

vi.mock("@/lib/global-seo-settings", () => ({
  fetchGlobalSeoSettings: mockFetchGlobalSeoSettings,
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
}));

const mockFetch = mockSanityFetchPage as Mock;

beforeEach(() => {
  mockFetch.mockResolvedValue({ data: [] });
});

describe("HomePage", () => {
  it("generateMetadata passes homepage fields to getPageMetadata", async () => {
    await generateMetadata();

    expect(mockFetchGlobalSeoSettings).toHaveBeenCalledWith("published");
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      {
        title: "College Sports News",
        description: "Default site description from CMS.",
        slug: "/",
      },
      "published",
    );
  });

  it("renders the hero and four division sections when no articles exist", async () => {
    const page = await HomePage();
    render(page);

    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.queryByText("Latest News")).not.toBeInTheDocument();
    expect(screen.getByText("FBS College Football News")).toBeInTheDocument();
    expect(screen.getByText("FCS College Football News")).toBeInTheDocument();
    expect(screen.getByText("Division II Football News")).toBeInTheDocument();
    expect(screen.getByText("Division III Football News")).toBeInTheDocument();
  });

  it("renders the Latest News section and article cards when articles exist", async () => {
    const article = {
      _id: "1",
      title: "Test Article",
      publishedAt: "2026-01-01T00:00:00Z",
      mainImage: null,
      slug: "test-article",
      authors: [{ name: "Test Author" }],
    };

    mockFetch
      .mockResolvedValueOnce({ data: [article] })
      .mockResolvedValueOnce({ data: [article] });

    const page = await HomePage();
    render(page);

    expect(screen.getByText("Latest News")).toBeInTheDocument();
    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View All/ })).toHaveAttribute(
      "href",
      "/college/news",
    );
  });

  it("passes hero posts to the Hero component", async () => {
    const heroArticle = {
      _id: "hero",
      title: "Hero Article",
      publishedAt: "2026-01-01T00:00:00Z",
      mainImage: null,
      slug: "hero-article",
      authors: [{ name: "Hero Author" }],
    };

    mockFetch.mockResolvedValueOnce({ data: [heroArticle] });

    const page = await HomePage();
    render(page);

    expect(screen.getByTestId("hero")).toBeInTheDocument();
  });

  it("renders division article sections when division data is returned", async () => {
    const divisionArticle = {
      _id: "division-1",
      title: "FBS Article",
      publishedAt: "2026-01-01T00:00:00Z",
      mainImage: null,
      slug: "fbs-article",
      authors: [{ name: "Division Author" }],
    };

    mockFetch
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [divisionArticle] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    const page = await HomePage();
    render(page);

    expect(screen.getByText("FBS College Football News")).toBeInTheDocument();
    expect(screen.getAllByTestId("article-section")).toHaveLength(4);
  });

  it("skips division sections when article data is missing", async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    const page = await HomePage();
    render(page);

    expect(
      screen.queryByText("FBS College Football News"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId("article-section")).toHaveLength(3);
  });
});
