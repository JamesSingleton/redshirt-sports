import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { portalEntry } from "../../helpers/transfer-portal-fixtures";

const { portal } = vi.hoisted(() => ({
  portal: {
    getCachedPortalSport: vi.fn(),
    getCachedPortalYears: vi.fn(),
    getCachedPortalCounts: vi.fn(),
    getCachedPortalFilterOptions: vi.fn(),
    getCachedPortalEntries: vi.fn(),
  },
}));

vi.mock("@/lib/transfer-portal", () => portal);

vi.mock("@/lib/draft-cache", () => ({
  searchParamsPage: (_fallback: unknown, render: () => Promise<unknown>) =>
    render(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/components/page-transition", () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/page-header", () => ({
  __esModule: true,
  default: ({
    title,
    subtitle,
    breadcrumbs,
    children,
  }: {
    title: string;
    subtitle: string;
    breadcrumbs: { title: string; href: string }[];
    children: ReactNode;
  }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <nav>
        {breadcrumbs.map((crumb) => (
          <a key={crumb.href} href={crumb.href}>
            {crumb.title}
          </a>
        ))}
      </nav>
      {children}
    </header>
  ),
}));

vi.mock("@/components/transfer-portal/portal-stats", () => ({
  PortalStats: ({ counts }: { counts: Record<string, number> }) => (
    <div data-testid="portal-stats" data-entered={counts.ENTERED} />
  ),
}));

vi.mock("@/components/transfer-portal/wire-filters", () => ({
  WireFilters: ({
    year,
    years,
    positions,
    conferences,
  }: {
    year: number;
    years: number[];
    positions: string[];
    conferences: { id: string }[];
  }) => (
    <div
      data-testid="wire-filters"
      data-year={year}
      data-years={years.join(",")}
      data-positions={positions.join(",")}
      data-conferences={conferences.map((c) => c.id).join(",")}
    />
  ),
}));

vi.mock("@/components/transfer-portal/wire-feed", () => ({
  WireFeed: ({
    query,
    caption,
    initialEntries,
    initialCursor,
  }: {
    query: unknown;
    caption: string;
    initialEntries: { id: string }[];
    initialCursor: string | null;
  }) => (
    <div
      data-testid="wire-feed"
      data-query={JSON.stringify(query)}
      data-caption={caption}
      data-entries={initialEntries.map((entry) => entry.id).join(",")}
      data-cursor={initialCursor ?? ""}
    />
  ),
}));

import TransferPortalPage, {
  generateMetadata,
} from "@/app/college/[sport]/transfer-portal/page";

const CURRENT_YEAR = new Date().getFullYear();

type Query = Record<string, string | string[] | undefined>;

async function renderPage(sport: string, query: Query = {}) {
  const page = await (TransferPortalPage({
    params: Promise.resolve({ sport }),
    searchParams: Promise.resolve(query),
  }) as unknown as Promise<ReactNode>);
  return render(page);
}

function mockData({
  years = [2026, 2025],
  entries = [portalEntry()],
}: {
  years?: number[];
  entries?: ReturnType<typeof portalEntry>[];
} = {}) {
  portal.getCachedPortalSport.mockResolvedValue({ id: "sport-1" });
  portal.getCachedPortalYears.mockResolvedValue(years);
  portal.getCachedPortalCounts.mockResolvedValue({
    counts: {
      ENTERED: 1500,
      COMMITTED: 0,
      SIGNED: 0,
      ENROLLED: 0,
      WITHDRAWN: 0,
    },
    total: 1500,
  });
  portal.getCachedPortalFilterOptions.mockResolvedValue({
    positions: ["QB"],
    conferences: [{ id: "conf-1", name: "Big Sky", shortName: null }],
  });
  portal.getCachedPortalEntries.mockResolvedValue({
    entries,
    nextCursor: entries.length ? "next" : null,
  });
}

describe("generateMetadata", () => {
  it("returns nothing for unknown sports", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ sport: "hockey" }) }),
    ).resolves.toEqual({});
  });

  it("describes the sport's portal", async () => {
    await expect(
      generateMetadata({
        params: Promise.resolve({ sport: "mens-basketball" }),
      }),
    ).resolves.toEqual({
      title: "Men's basketball Transfer Portal",
      description:
        "Every men's basketball player in the transfer portal, with commitments and withdrawals as they happen.",
    });
  });
});

describe("TransferPortalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("404s for sports without a portal", async () => {
    await expect(renderPage("hockey")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(portal.getCachedPortalSport).not.toHaveBeenCalled();
  });

  it("404s when the sport is missing from the database", async () => {
    portal.getCachedPortalSport.mockResolvedValue(null);
    await expect(renderPage("football")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(portal.getCachedPortalSport).toHaveBeenCalledWith("football");
  });

  it("renders the wire for a requested year with filters", async () => {
    mockData();
    await renderPage("football", {
      year: "2025",
      status: ["COMMITTED", "SIGNED"],
      position: " QB ",
      conference: "conf-1",
      q: "doe",
    });

    expect(
      screen.getByRole("heading", { name: "2025 Football transfer portal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1,500 players have entered the portal this cycle."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      "/college/football",
    );
    expect(
      screen.getByRole("link", { name: "Transfer portal" }),
    ).toHaveAttribute("href", "/college/football/transfer-portal");
    expect(screen.getByTestId("portal-stats")).toHaveAttribute(
      "data-entered",
      "1500",
    );

    const filters = {
      sport: "football",
      portalYear: 2025,
      status: "COMMITTED",
      position: "QB",
      conferenceId: "conf-1",
      search: "doe",
    };
    const scope = { sport: "football", sportId: "sport-1", portalYear: 2025 };
    expect(portal.getCachedPortalYears).toHaveBeenCalledWith("sport-1");
    expect(portal.getCachedPortalCounts).toHaveBeenCalledWith(scope);
    expect(portal.getCachedPortalFilterOptions).toHaveBeenCalledWith(scope);
    expect(portal.getCachedPortalEntries).toHaveBeenCalledWith({
      ...filters,
      sportId: "sport-1",
    });

    const wireFilters = screen.getByTestId("wire-filters");
    expect(wireFilters).toHaveAttribute("data-year", "2025");
    expect(wireFilters).toHaveAttribute("data-years", "2026,2025");
    expect(wireFilters).toHaveAttribute("data-positions", "QB");
    expect(wireFilters).toHaveAttribute("data-conferences", "conf-1");

    const feed = screen.getByTestId("wire-feed");
    expect(JSON.parse(feed.getAttribute("data-query") ?? "")).toEqual(filters);
    expect(feed).toHaveAttribute(
      "data-caption",
      "2025 Football transfer portal entries",
    );
    expect(feed).toHaveAttribute("data-entries", "entry-1");
    expect(feed).toHaveAttribute("data-cursor", "next");
  });

  it.each([
    ["missing", {}],
    ["malformed", { year: "2025abc" }],
    ["non-numeric", { year: "soon" }],
  ])("falls back to the current year when the year is %s", async (_, query) => {
    mockData({ years: [2020] });
    await renderPage("womens-basketball", { ...query, status: "BOGUS" });

    expect(
      screen.getByRole("heading", {
        name: `${CURRENT_YEAR} Women's basketball transfer portal`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("wire-filters")).toHaveAttribute(
      "data-years",
      `${CURRENT_YEAR},2020`,
    );
    expect(portal.getCachedPortalEntries).toHaveBeenCalledWith({
      sport: "womens-basketball",
      sportId: "sport-1",
      portalYear: CURRENT_YEAR,
      status: undefined,
      position: undefined,
      conferenceId: undefined,
      search: undefined,
    });
  });

  it("explains an empty cycle without filters", async () => {
    mockData({ entries: [] });
    await renderPage("football", { q: "   ", position: [] });
    expect(screen.queryByTestId("wire-feed")).not.toBeInTheDocument();
    expect(screen.getByText("No players found")).toBeInTheDocument();
    expect(
      screen.getByText("No portal entries have been added for this cycle yet."),
    ).toBeInTheDocument();
  });

  it.each([
    { status: "ENROLLED" },
    { position: "WR" },
    { conference: "conf-1" },
    { q: "smith" },
  ])("suggests clearing filters when %o matches nothing", async (query) => {
    mockData({ entries: [] });
    await renderPage("football", query);
    expect(
      screen.getByText(
        "No portal entries match these filters. Try clearing one.",
      ),
    ).toBeInTheDocument();
  });
});
