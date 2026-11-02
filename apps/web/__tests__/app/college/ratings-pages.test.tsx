import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  resolveSuspense,
  weekModel,
} from "@/__tests__/helpers/ratings-fixtures";

const data = vi.hoisted(() => ({
  loadRatingsWeek: vi.fn(),
  loadRatingsTeam: vi.fn(),
  loadRatingsSeason: vi.fn(),
  requirePool: vi.fn(),
  getCachedPublicPools: vi.fn(),
  getCachedWeeks: vi.fn(),
  getCachedRun: vi.fn(),
  getCachedPredictions: vi.fn(),
}));
const mockGetPageMetadata = vi.hoisted(() => vi.fn((input: unknown) => input));
const mockValidationReport = vi.hoisted(() => vi.fn());

vi.mock("@/lib/ratings/data", () => data);
vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));
vi.mock("@/lib/ratings/validation", () => ({
  validationReport: mockValidationReport,
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/ratings/ratings-week-view", () => ({
  RatingsWeekView: ({ sort, basePath }: { sort: string; basePath: string }) => (
    <div data-testid="week-view" data-sort={sort} data-base={basePath} />
  ),
}));
vi.mock("@/components/ratings/ratings-week-picker", () => ({
  RatingsWeekPicker: ({ suffix }: { suffix: string }) => (
    <div data-testid="picker" data-suffix={suffix} />
  ),
}));
vi.mock("@/components/ratings/team-sheet-page", () => ({
  TeamSheetPage: ({ data: d }: { data: { row: { name: string } } }) => (
    <div data-testid="team">{d.row.name}</div>
  ),
}));
vi.mock("@/components/ratings/team-sheet", () => ({
  TeamSheet: ({
    row,
    opponentHref,
    showTierLegend,
  }: {
    row: { name: string };
    opponentHref: (id: string) => string | null;
    showTierLegend: boolean;
  }) => (
    <div
      data-testid="sheet"
      data-href={String(opponentHref("x"))}
      data-legend={String(showTierLegend)}
    >
      {row.name}
    </div>
  ),
  TierLegend: () => <div data-testid="legend" />,
}));
vi.mock("@/components/ratings/ratings-methodology", () => ({
  RatingsMethodology: ({ pools }: { pools: Array<{ label: string }> }) => (
    <div data-testid="method">{pools.map((pool) => pool.label).join(",")}</div>
  ),
}));
vi.mock("@/components/ratings/ratings-accuracy", () => ({
  RatingsAccuracy: ({
    poolName,
    summary,
  }: {
    poolName: string;
    summary: { allTime: { games: number } };
  }) => (
    <div data-testid="accuracy">
      {poolName} {summary.allTime.games}
    </div>
  ),
}));

import WeekPage, {
  generateMetadata as weekMeta,
} from "@/app/college/[sport]/ratings/[pool]/[year]/[week]/page";
import TeamSheetsPage, {
  generateMetadata as teamSheetsMeta,
} from "@/app/college/[sport]/ratings/[pool]/[year]/[week]/team-sheets/page";
import WeekTeamPage, {
  generateMetadata as weekTeamMeta,
} from "@/app/college/[sport]/ratings/[pool]/[year]/[week]/teams/[slug]/page";
import { GET as seasonRedirect } from "@/app/college/[sport]/ratings/[pool]/[year]/route";
import AccuracyPage, {
  generateMetadata as accuracyMeta,
} from "@/app/college/[sport]/ratings/[pool]/accuracy/page";
import RatingsLayout from "@/app/college/[sport]/ratings/[pool]/layout";
import Loading from "@/app/college/[sport]/ratings/[pool]/loading";
import LatestPage, {
  generateMetadata as latestMeta,
} from "@/app/college/[sport]/ratings/[pool]/page";
import TeamPage, {
  generateMetadata as teamMeta,
} from "@/app/college/[sport]/ratings/[pool]/teams/[slug]/page";
import MethodologyPage, {
  generateMetadata as methodologyMeta,
} from "@/app/ratings/methodology/page";
import sitemap from "@/app/ratings/sitemap";

const model = weekModel();
const pool = { sport: "football", pool: "fcs" };
const p = <T,>(value: T) => Promise.resolve(value);

describe("ratings pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    data.loadRatingsWeek.mockResolvedValue(model);
    data.loadRatingsTeam.mockResolvedValue({ model, row: model.rows[0] });
    data.loadRatingsSeason.mockResolvedValue({
      pool: model.pool,
      weeks: model.weeks.slice(0, 2).reverse(),
      years: [2025, 2024],
    });
    data.requirePool.mockResolvedValue(model.pool);
    data.getCachedPublicPools.mockResolvedValue([model.pool]);
    data.getCachedPredictions.mockResolvedValue([
      { year: 2025, seasonType: 2, weekNumber: 2, predicted: 3, actual: 7 },
    ]);
    mockValidationReport.mockReturnValue({ championRanks: [] });
  });

  it("renders the layout and loading state", () => {
    render(<RatingsLayout>child</RatingsLayout>);
    expect(screen.getByText("child")).toBeInTheDocument();
    render(<Loading />);
    expect(screen.getByLabelText("Loading ratings")).toBeInTheDocument();
  });

  it("latest page: canonical metadata and the parsed sort", async () => {
    await expect(latestMeta({ params: p(pool) })).resolves.toMatchObject({
      title: "FCS College Football Ratings & Strength of Schedule (2025)",
      slug: "/college/football/ratings/fcs",
    });
    render(
      await resolveSuspense(
        LatestPage({ params: p(pool), searchParams: p({ sort: "sos" }) }),
      ),
    );
    expect(screen.getByTestId("week-view")).toHaveAttribute("data-sort", "sos");
    expect(data.loadRatingsWeek).toHaveBeenCalledWith(pool);
  });

  it("week page: archive metadata and base path", async () => {
    const params = p({ ...pool, year: "2025", week: "postseason" });
    await expect(weekMeta({ params })).resolves.toMatchObject({
      title:
        "2025 Postseason FCS College Football Ratings & Strength of Schedule",
      slug: "/college/football/ratings/fcs/2025/postseason",
    });
    render(await resolveSuspense(WeekPage({ params, searchParams: p({}) })));
    expect(screen.getByTestId("week-view")).toHaveAttribute(
      "data-base",
      "/college/football/ratings/fcs/2025/postseason",
    );
    expect(screen.getByTestId("week-view")).toHaveAttribute("data-sort", "sor");
  });

  it("a season URL redirects (307) to that season's latest week", async () => {
    const res = await seasonRedirect(
      new Request("https://x.test/college/football/ratings/fcs/2025"),
      { params: p({ ...pool, year: "2025" }) },
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://x.test/college/football/ratings/fcs/2025/postseason",
    );
    data.loadRatingsSeason.mockResolvedValueOnce({
      pool: model.pool,
      weeks: [],
      years: [],
    });
    const empty = await seasonRedirect(
      new Request("https://x.test/college/football/ratings/fcs/2025"),
      { params: p({ ...pool, year: "2025" }) },
    );
    expect(empty.headers.get("location")).toBe(
      "https://x.test/college/football/ratings/fcs/2025/",
    );
  });

  it("latest team sheet is indexable; archived one is noindex", async () => {
    await expect(
      teamMeta({ params: p({ ...pool, slug: "montana-state-bobcats" }) }),
    ).resolves.toMatchObject({
      title: "Montana State Strength of Schedule & FCS Rating (2025)",
      slug: "/college/football/ratings/fcs/teams/montana-state-bobcats",
    });
    render(
      await resolveSuspense(
        TeamPage({ params: p({ ...pool, slug: "montana-state-bobcats" }) }),
      ),
    );
    expect(screen.getByTestId("team")).toHaveTextContent("Montana State");

    const archived = p({
      ...pool,
      year: "2025",
      week: "postseason",
      slug: "montana-state-bobcats",
    });
    await expect(weekTeamMeta({ params: archived })).resolves.toMatchObject({
      noIndex: true,
    });
    render(await resolveSuspense(WeekTeamPage({ params: archived })));
    expect(screen.getAllByTestId("team")).toHaveLength(2);
  });

  it("printable team sheets: picker, one tier legend, every team, noindex", async () => {
    const params = p({ ...pool, year: "2025", week: "postseason" });
    await expect(teamSheetsMeta({ params })).resolves.toMatchObject({
      noIndex: true,
    });
    render(await resolveSuspense(TeamSheetsPage({ params })));
    expect(screen.getByTestId("picker")).toHaveAttribute(
      "data-suffix",
      "/team-sheets",
    );
    expect(screen.getAllByTestId("legend")).toHaveLength(1);
    expect(screen.getAllByTestId("sheet")).toHaveLength(3);
    expect(screen.getAllByTestId("sheet")[0]).toHaveAttribute(
      "data-href",
      "null",
    );
    expect(screen.getAllByTestId("sheet")[0]).toHaveAttribute(
      "data-legend",
      "false",
    );
  });

  it("methodology lists every public pool", async () => {
    await expect(methodologyMeta()).resolves.toMatchObject({
      slug: "/ratings/methodology",
    });
    render(await resolveSuspense(MethodologyPage()));
    expect(screen.getByTestId("method")).toHaveTextContent("FCS football");
  });

  it("methodology 404s until a pool is public", async () => {
    data.getCachedPublicPools.mockResolvedValue([]);
    await expect(resolveSuspense(MethodologyPage())).rejects.toThrow();
  });

  it("accuracy summarizes the pool's predictions", async () => {
    await expect(accuracyMeta({ params: p(pool) })).resolves.toMatchObject({
      title: "FCS Ratings Accuracy: Every Pick, Week by Week",
      slug: "/college/football/ratings/fcs/accuracy",
    });
    render(await resolveSuspense(AccuracyPage({ params: p(pool) })));
    expect(screen.getByTestId("accuracy")).toHaveTextContent("FCS 1");
    expect(data.getCachedPredictions).toHaveBeenCalledWith(
      "football",
      "fcs",
      "pool-1",
    );
  });
});

describe("ratings sitemap", () => {
  it("lists the methodology, then each public pool's latest, accuracy, weeks, and latest team sheets", async () => {
    data.getCachedPublicPools.mockResolvedValue([
      model.pool,
      { ...model.pool, id: "empty", slug: "fbs" },
    ]);
    data.getCachedWeeks.mockImplementation(async (_s: string, slug: string) =>
      slug === "fcs" ? model.weeks : [],
    );
    data.getCachedRun.mockResolvedValue({ run: model.run, rows: model.rows });
    const urls = (await sitemap()).map((entry) =>
      entry.url.replace(/^https?:\/\/[^/]+/, ""),
    );
    expect(urls[0]).toBe("/ratings/methodology");
    expect(urls).toContain("/college/football/ratings/fcs");
    expect(urls).toContain("/college/football/ratings/fcs/accuracy");
    expect(urls).toContain("/college/football/ratings/fcs/2025/16");
    expect(urls).toContain(
      "/college/football/ratings/fcs/teams/north-dakota-state-bison",
    );
    expect(urls.filter((url) => url.includes("/teams/"))).toHaveLength(2);
    expect(urls.some((url) => url.includes("/fbs"))).toBe(false);
  });

  it("is empty without public pools, and skips team sheets without a readable run", async () => {
    data.getCachedPublicPools.mockResolvedValue([]);
    expect(await sitemap()).toEqual([]);
    data.getCachedPublicPools.mockResolvedValue([model.pool]);
    data.getCachedWeeks.mockResolvedValue(model.weeks);
    data.getCachedRun.mockResolvedValue(null);
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/teams/"))).toBe(false);
  });
});
