import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import HomePage, { generateMetadata } from "@/app/page";

const { mockSanityFetchPage, mockGetDynamicFetchOptions } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockGetDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwarePage: (
    _fallback: unknown,
    render: (options: {
      perspective: string;
      stega: boolean;
    }) => Promise<unknown>,
  ) => render({ perspective: "published", stega: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryRecentContributors: "mock-authors",
  queryHomePageData: "mock-home",
  queryLatestArticles: "mock-latest",
  queryLatestCollegeSportsArticles: "mock-college",
}));

type MockArticle = { _id: string; title: string };
type MockSectionProps = {
  id: string;
  title: string;
  href: string;
  articles: MockArticle[];
  columns?: number;
};

function mockSection(variant: string) {
  return ({ id, title, href, articles, columns }: MockSectionProps) =>
    articles.length === 0 ? null : (
      <section
        data-testid={id}
        data-variant={variant}
        data-columns={columns ? String(columns) : undefined}
      >
        <h2>{title}</h2>
        <a href={href}>See all</a>
        {articles.map((article) => (
          <p key={article._id}>{article.title}</p>
        ))}
      </section>
    );
}

vi.mock("@/components/home/sections", () => ({
  FeatureSection: mockSection("feature"),
  GridSection: mockSection("grid"),
  LeadListSection: mockSection("lead-list"),
  SplitSection: mockSection("split"),
}));

vi.mock("@/components/home/megaboard", () => ({
  Megaboard: ({ articles }: { articles: MockArticle[] }) => (
    <div data-testid="megaboard">
      {articles.map((article) => (
        <span key={article._id}>{article.title}</span>
      ))}
    </div>
  ),
}));

vi.mock("@/components/our-team-card", () => ({
  OurTeamCard: ({ authors }: { authors: { _id: string; name: string }[] }) => (
    <div data-testid="our-team-card">{authors.length} authors</div>
  ),
}));

vi.mock("@/components/rankings/top25-card", () => ({
  Top25Card: () => <div data-testid="top25-card" />,
  Top25CardSkeleton: () => <div data-testid="top25-skeleton" />,
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data }: { data: Record<string, unknown> }) => (
    <script
      data-testid="home-json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  ),
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
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

type FetchArgs = {
  query: string;
  params?: { division?: string; sport?: string; articleIds?: string[] };
};

function article(id: string, title = `Article ${id}`) {
  return {
    _id: id,
    title,
    publishedAt: "2026-01-01T00:00:00Z",
    image: null,
    slug: id,
    authors: [{ name: "Test Author" }],
  };
}

function setupFetch({
  home = [],
  latest = [],
  authors = [],
  divisions = {},
}: {
  home?: MockArticle[];
  latest?: MockArticle[];
  authors?: { _id: string; name: string }[];
  divisions?: Record<string, unknown>;
}) {
  mockSanityFetchPage.mockImplementation(({ query, params }: FetchArgs) => {
    switch (query) {
      case "mock-home":
        return Promise.resolve({ data: home });
      case "mock-latest":
        return Promise.resolve({ data: latest });
      case "mock-authors":
        return Promise.resolve({ data: authors });
      default: {
        const division = params?.division ?? "";
        return Promise.resolve(
          division in divisions ? divisions[division] : { data: [] },
        );
      }
    }
  });
}

async function renderHomePage() {
  const page = await (HomePage() as unknown as Promise<ReactNode>);
  return render(page);
}

beforeEach(() => {
  mockSanityFetchPage.mockReset();
  setupFetch({});
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

  it("renders the megaboard and sidebar without sections when no articles exist", async () => {
    await renderHomePage();

    expect(screen.getByTestId("megaboard")).toBeEmptyDOMElement();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByTestId("top25-card")).toBeInTheDocument();
    expect(screen.getByTestId("our-team-card")).toHaveTextContent("0 authors");
  });

  it("renders the megaboard lead stories and the Latest news grid", async () => {
    setupFetch({
      home: [article("hero", "Hero Article")],
      latest: [article("latest", "Latest Article")],
      authors: [{ _id: "a1", name: "Writer" }],
    });

    await renderHomePage();

    expect(
      within(screen.getByTestId("megaboard")).getByText("Hero Article"),
    ).toBeInTheDocument();
    const latest = screen.getByTestId("section-latest");
    expect(
      within(latest).getByRole("heading", { name: "Latest news" }),
    ).toBeInTheDocument();
    expect(within(latest).getByText("Latest Article")).toBeInTheDocument();
    expect(within(latest).getByRole("link")).toHaveAttribute(
      "href",
      "/college/news",
    );
    expect(screen.getByTestId("our-team-card")).toHaveTextContent("1 authors");
  });

  it("excludes megaboard and latest articles from the sport section queries", async () => {
    setupFetch({
      home: [article("hero")],
      latest: [article("latest")],
    });

    await renderHomePage();

    const sectionCalls = (mockSanityFetchPage.mock.calls as [FetchArgs][])
      .map(([args]) => args)
      .filter((args) => args.query === "mock-college");
    expect(sectionCalls).toHaveLength(5);
    for (const args of sectionCalls) {
      expect(args.params?.articleIds).toEqual(["hero", "latest"]);
    }
    expect(
      sectionCalls.map((args) => [args.params?.sport, args.params?.division]),
    ).toEqual([
      ["Football", "Football Championship Subdivision"],
      ["Football", "Football Bowl Subdivision"],
      ["Football", "D2"],
      ["Football", "D3"],
      ["Men's Basketball", "Mid-Major"],
    ]);
  });

  it("renders each sport section with its layout, title and link", async () => {
    setupFetch({
      divisions: {
        "Football Championship Subdivision": { data: [article("fcs")] },
        "Football Bowl Subdivision": { data: [article("fbs")] },
        D2: { data: [article("d2")] },
        D3: { data: [article("d3")] },
        "Mid-Major": { data: [article("mm")] },
      },
    });

    await renderHomePage();

    const expected = [
      ["section-fcs", "feature", "FCS football", "/college/football/news/fcs"],
      ["section-fbs", "grid", "FBS football", "/college/football/news/fbs"],
      [
        "section-d2",
        "split",
        "Division II football",
        "/college/football/news/d2",
      ],
      [
        "section-d3",
        "lead-list",
        "Division III football",
        "/college/football/news/d3",
      ],
      [
        "section-mid-major",
        "split",
        "Mid-major men's basketball",
        "/college/mens-basketball/news/mid-major",
      ],
    ] as const;

    for (const [testId, variant, title, href] of expected) {
      const section = screen.getByTestId(testId);
      expect(section).toHaveAttribute("data-variant", variant);
      expect(
        within(section).getByRole("heading", { name: title }),
      ).toBeInTheDocument();
      expect(within(section).getByRole("link")).toHaveAttribute("href", href);
    }
    expect(screen.getByTestId("section-fbs")).toHaveAttribute(
      "data-columns",
      "3",
    );
  });

  it("skips a sport section when its article data is missing", async () => {
    setupFetch({
      divisions: {
        "Football Championship Subdivision": { data: [article("fcs")] },
        "Football Bowl Subdivision": {},
        D2: { data: [article("d2")] },
      },
    });

    await renderHomePage();

    expect(screen.getByTestId("section-fcs")).toBeInTheDocument();
    expect(screen.queryByTestId("section-fbs")).not.toBeInTheDocument();
    expect(screen.getByTestId("section-d2")).toBeInTheDocument();
  });

  it("does not read draft fetch options for the published render", async () => {
    await renderHomePage();
    expect(mockGetDynamicFetchOptions).not.toHaveBeenCalled();
  });

  it("falls back to app name and undefined description when SEO settings are missing", async () => {
    const previousAppName = process.env.NEXT_PUBLIC_APP_NAME;
    process.env.NEXT_PUBLIC_APP_NAME = "Redshirt Sports Fallback";
    mockFetchGlobalSeoSettings.mockResolvedValueOnce(null);

    await renderHomePage();

    const jsonLd = screen.getByTestId("home-json-ld");
    const data = JSON.parse(jsonLd.innerHTML);
    expect(data.name).toBe("Redshirt Sports Fallback");
    expect(data.description).toBeUndefined();

    process.env.NEXT_PUBLIC_APP_NAME = previousAppName;
  });
});
