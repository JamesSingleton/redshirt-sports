import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockGetPageMetadata,
  mockNotFound,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockGetPageMetadata: vi.fn(() => ({ title: "Sport Hub" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: async (
    params: Promise<{ sport: string }>,
    _fallback: unknown,
    render: (
      resolved: { sport: string },
      options: { perspective: string; stega: boolean },
    ) => Promise<ReactNode>,
  ) => render(await params, { perspective: "published", stega: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  querySportHubData: "querySportHubData",
  sportInfoBySlug: "sportInfoBySlug",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/components/home/home-page-skeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton" />,
}));

vi.mock("@/components/home/megaboard", () => ({
  Megaboard: ({
    articles,
    leadHeadingLevel,
  }: {
    articles: Array<{ _id: string }>;
    leadHeadingLevel: string;
  }) => (
    <div data-testid="megaboard" data-level={leadHeadingLevel}>
      {articles.map((article) => article._id).join(",")}
    </div>
  ),
}));

vi.mock("@/components/home/sections", () => {
  function section(layout: string) {
    return ({
      id,
      title,
      description,
      href,
      articles,
    }: {
      id: string;
      title: string;
      description?: string;
      href: string;
      articles: Array<{ _id: string }>;
    }) => (
      <section
        data-testid="section"
        data-layout={layout}
        data-id={id}
        data-href={href}
        data-description={description ?? ""}
      >
        <h2>{title}</h2>
        {articles.map((article) => article._id).join(",")}
      </section>
    );
  }
  return {
    FeatureSection: section("feature"),
    SplitSection: section("split"),
    LeadListSection: section("lead-list"),
    GridSection: section("grid"),
  };
});

vi.mock("@/components/news/filter-row", () => ({
  FilterRow: ({
    label,
    items,
  }: {
    label: string;
    items: Array<{ key: string; label: string; href: string }>;
  }) => (
    <nav aria-label={label}>
      {items.map((item) => (
        <a key={item.key} href={item.href}>
          {item.label}
        </a>
      ))}
    </nav>
  ),
}));

vi.mock("@/components/page-header", () => ({
  __esModule: true,
  default: ({ title, children }: { title: string; children: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {children}
    </header>
  ),
}));

vi.mock("@/components/page-transition", () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/rankings/poll-aside", () => ({
  PollAside: ({ sport }: { sport: string }) => (
    <div data-testid="poll-aside">{sport}</div>
  ),
}));

import SportHubPage, { generateMetadata } from "@/app/college/[sport]/page";

function post(id: string) {
  return { _id: id, title: `Post ${id}`, slug: id };
}

function group(
  id: string,
  shortName: string | null,
  name: string | null,
  postIds: string[],
) {
  return {
    _id: id,
    slug: id,
    shortName,
    name,
    posts: postIds.map(post),
  };
}

async function renderHub(sport = "football") {
  const page = await SportHubPage({ params: Promise.resolve({ sport }) });
  return render(page as ReactNode);
}

describe("SportHubPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockGetPageMetadata.mockClear();
    mockNotFound.mockClear();
  });

  it("generateMetadata throws notFound when the sport is unknown", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });

    await expect(
      generateMetadata({ params: Promise.resolve({ sport: "curling" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata builds the sport hub title and description", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: { title: "Football" } });

    await generateMetadata({ params: Promise.resolve({ sport: "football" }) });

    expect(mockSanityFetchMetadata).toHaveBeenCalledWith({
      query: "sportInfoBySlug",
      params: { slug: "football" },
      perspective: "published",
    });
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "College Football News, Rankings & Analysis",
        description: expect.stringContaining("college football news"),
        slug: "/college/football",
      }),
      "published",
    );
  });

  it.each([
    ["no data", null],
    ["no sport", { sport: null, latest: [post("1")], groups: [] }],
    [
      "no latest posts",
      {
        sport: { _id: "s", title: "Football", slug: "football" },
        latest: [],
        groups: [],
      },
    ],
  ])("throws notFound when there is %s", async (_label, data) => {
    mockSanityFetchPage.mockResolvedValue({ data });

    await expect(renderHub()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the megaboard, division filters, rotating sections and poll aside", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: {
        sport: { _id: "s", title: "Football", slug: "football" },
        latest: [post("l1"), post("l2")],
        groups: [
          group("fcs", "FCS", "Football Championship Subdivision", [
            "l1",
            "a1",
            "a2",
          ]),
          group("fbs", "FBS", "FBS", ["a1", "b1"]),
          group("d2", null, "Division II", ["c1"]),
          group("d3", null, null, ["d1"]),
          group("empty", "Empty", "Empty", ["l2", "b1"]),
          group("naia", "NAIA", null, ["e1"]),
        ],
      },
    });

    await renderHub();

    expect(mockSanityFetchPage).toHaveBeenCalledWith({
      query: "querySportHubData",
      params: { sport: "football" },
      perspective: "published",
      stega: false,
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "College Football" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("megaboard")).toHaveTextContent("l1,l2");
    expect(screen.getByTestId("megaboard")).toHaveAttribute("data-level", "h2");

    const filters = within(
      screen.getByRole("navigation", { name: "Football news by division" }),
    ).getAllByRole("link");
    expect(filters.map((link) => link.textContent)).toEqual([
      "All news",
      "FCS",
      "FBS",
      "Division II",
      "",
      "Empty",
      "NAIA",
    ]);
    expect(filters[0]).toHaveAttribute("href", "/college/football/news");
    expect(filters[1]).toHaveAttribute("href", "/college/football/news/fcs");

    const sections = screen.getAllByTestId("section");
    expect(
      sections.map((section) => [
        section.dataset.layout,
        section.dataset.id,
        section.textContent,
        section.dataset.description,
      ]),
    ).toEqual([
      [
        "feature",
        "section-fcs",
        "FCS footballa1,a2",
        "Football Championship Subdivision",
      ],
      ["split", "section-fbs", "FBS footballb1", ""],
      ["lead-list", "section-d2", "null footballc1", "Division II"],
      ["grid", "section-d3", "null footballd1", ""],
      ["feature", "section-naia", "NAIA footballe1", ""],
    ]);
    expect(sections[0]).toHaveAttribute(
      "data-href",
      "/college/football/news/fcs",
    );
    expect(screen.getByTestId("poll-aside")).toHaveTextContent("football");
  });
});
