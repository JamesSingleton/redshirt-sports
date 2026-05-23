import { sanityFetch } from "@redshirt-sports/sanity/live";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Mock } from "vitest";

import HomePage from "../page";

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetch: vi.fn(),
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

vi.mock("@/lib/seo", () => ({
  getSEOMetadata: () => ({}),
}));

const mockFetch = sanityFetch as Mock;

beforeEach(() => {
  mockFetch.mockResolvedValue({ data: [] });
});

describe("HomePage", () => {
  it("renders the hero without division sections when no articles exist", async () => {
    const page = await HomePage();
    render(page);

    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.queryByText("Latest News")).not.toBeInTheDocument();
    expect(
      screen.queryByText("FBS College Football News"),
    ).not.toBeInTheDocument();
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

    const divisionArticle = {
      ...article,
      excerpt: "Excerpt",
    };

    mockFetch
      .mockResolvedValueOnce({ data: [article] }) // homePageData
      .mockResolvedValueOnce({ data: [article] }) // latestArticles
      .mockResolvedValue({ data: [divisionArticle] }); // division sections

    const page = await HomePage();
    render(page);

    expect(screen.getByText("Latest News")).toBeInTheDocument();
    expect(screen.getByText("Test Article")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View All/ })).toHaveAttribute(
      "href",
      "/college/news",
    );
  });
});
