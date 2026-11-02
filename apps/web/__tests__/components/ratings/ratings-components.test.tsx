import { fireEvent, render, screen, within } from "@testing-library/react";
import { createContext, type ReactNode, useContext } from "react";

import {
  config,
  rows,
  teamModel,
  teamRow,
  weekModel,
} from "@/__tests__/helpers/ratings-fixtures";

const mockPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
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
vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data, id }: { data: unknown; id: string }) => (
    <script type="application/ld+json" id={id}>
      {JSON.stringify(data)}
    </script>
  ),
}));
vi.mock("@/components/sanity-image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
// Radix menus only render their items when open; render everything inline instead.
vi.mock("@redshirt-sports/ui/components/dropdown-menu", () => {
  const Pass = ({ children }: { children: ReactNode }) => <div>{children}</div>;
  return {
    DropdownMenu: Pass,
    DropdownMenuTrigger: Pass,
    DropdownMenuContent: Pass,
    DropdownMenuItem: Pass,
    DropdownMenuLabel: Pass,
    DropdownMenuSeparator: () => <hr />,
  };
});
// A stand-in for the Radix select: every option is a button that fires onValueChange.
vi.mock("@redshirt-sports/ui/components/select", async () => {
  const Context = createContext<(value: string) => void>(() => {});
  return {
    Select: ({
      children,
      onValueChange,
    }: {
      children: ReactNode;
      onValueChange: (value: string) => void;
    }) => <Context.Provider value={onValueChange}>{children}</Context.Provider>,
    SelectTrigger: ({ children, id }: { children: ReactNode; id: string }) => (
      <div id={id} data-testid="trigger">
        {children}
      </div>
    ),
    SelectValue: ({ children }: { children: ReactNode }) => (
      <span>{children}</span>
    ),
    SelectContent: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    SelectItem: ({
      children,
      value,
    }: {
      children: ReactNode;
      value: string;
    }) => {
      const change = useContext(Context);
      return (
        <button type="button" onClick={() => change(value)}>
          option {children}
        </button>
      );
    },
  };
});

import { RatingsAccuracy } from "@/components/ratings/ratings-accuracy";
import {
  pickerWeeks,
  RatingsHeader,
  ratingsTitle,
} from "@/components/ratings/ratings-header";
import { RatingsMethodology } from "@/components/ratings/ratings-methodology";
import { RatingsSkeleton } from "@/components/ratings/ratings-skeleton";
import { RatingsTable } from "@/components/ratings/ratings-table";
import { RatingsWeekPicker } from "@/components/ratings/ratings-week-picker";
import { RatingsWeekView } from "@/components/ratings/ratings-week-view";
import { TeamLogo } from "@/components/ratings/team-logo";
import { TeamSheet, TierLegend } from "@/components/ratings/team-sheet";
import { TeamSheetPage } from "@/components/ratings/team-sheet-page";
import { summarizePredictions } from "@/lib/ratings/accuracy";
import { validationReport } from "@/lib/ratings/validation";

describe("RatingsHeader", () => {
  it("titles the pool and links the method, accuracy, sheets, and data", () => {
    const model = weekModel();
    render(<RatingsHeader model={model} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      ratingsTitle(model),
    );
    expect(
      screen.getByText(/2025 Postseason · through Monday, January 5 · latest/),
    ).toBeInTheDocument();
    expect(screen.getByText("How it works")).toHaveAttribute(
      "href",
      "/ratings/methodology",
    );
    expect(screen.getByText("Accuracy")).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs/accuracy",
    );
    expect(
      screen.getByRole("button", { name: /Download/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("2025 Postseason")).toBeInTheDocument();
    expect(screen.getByText("2025 season")).toBeInTheDocument();
    expect(screen.getByText("CSV").closest("a")).toHaveAttribute(
      "href",
      "/api/ratings/football/fcs/2025/postseason?format=csv",
    );
    expect(screen.getByText("JSON").closest("a")).toHaveAttribute(
      "href",
      "/api/ratings/football/fcs/2025/postseason?format=json",
    );
    expect(screen.getByText("Excel workbook").closest("a")).toHaveAttribute(
      "href",
      "/api/ratings/football/fcs/2025",
    );
    expect(screen.queryByText(/provisional/)).not.toBeInTheDocument();
  });

  it("flags a provisional week and omits the as-of date when there is none", () => {
    const model = weekModel();
    render(
      <RatingsHeader
        model={{
          ...model,
          week: model.weeks[1]!,
          isLatest: false,
          run: {
            ...model.run,
            diagnostics: { ...model.run.diagnostics, leagueProvisional: true },
          },
        }}
      />,
    );
    expect(
      screen.getByText(/Early-season ratings are provisional/),
    ).toBeInTheDocument();
    // The as-of line, and the download menu's section label.
    expect(screen.getAllByText("2025 Week 16")).toHaveLength(2);
  });

  it("passes every published week to the picker", () => {
    expect(pickerWeeks(weekModel())).toEqual([
      { year: 2025, segment: "postseason", label: "Postseason" },
      { year: 2025, segment: "16", label: "Week 16" },
      { year: 2024, segment: "postseason", label: "Postseason" },
    ]);
  });
});

describe("RatingsWeekPicker", () => {
  const weeks = pickerWeeks(weekModel());
  beforeEach(() => mockPush.mockReset());

  it("labels both dropdowns and shows the current values", () => {
    render(
      <RatingsWeekPicker
        weeks={weeks}
        year={2025}
        segment="16"
        basePath="/b"
      />,
    );
    expect(screen.getByText("Season")).toBeInTheDocument();
    expect(screen.getByText("Week")).toBeInTheDocument();
    const [season, week] = screen.getAllByTestId("trigger");
    expect(season).toHaveTextContent("2025");
    expect(week).toHaveTextContent("Week 16");
  });

  it("goes to a season's latest week, and to a picked week, keeping the suffix", () => {
    render(
      <RatingsWeekPicker
        weeks={weeks}
        year={2025}
        segment="16"
        basePath="/b"
        suffix="/team-sheets"
      />,
    );
    fireEvent.click(screen.getByText("option 2024"));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/b/2024/postseason/team-sheets",
      {
        transitionTypes: expect.any(Array),
      },
    );
    fireEvent.click(screen.getByText("option Postseason"));
    expect(mockPush).toHaveBeenLastCalledWith(
      "/b/2025/postseason/team-sheets",
      {
        transitionTypes: expect.any(Array),
      },
    );
  });

  it("does nothing when re-picking the current season or week", () => {
    render(
      <RatingsWeekPicker
        weeks={weeks}
        year={2025}
        segment="16"
        basePath="/b"
      />,
    );
    fireEvent.click(screen.getByText("option 2025"));
    fireEvent.click(screen.getByText("option Week 16"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("falls back to the raw segment if the week isn't listed", () => {
    render(
      <RatingsWeekPicker weeks={weeks} year={2030} segment="3" basePath="/b" />,
    );
    expect(screen.getAllByTestId("trigger")[1]).toHaveTextContent("3");
  });
});

describe("TeamLogo", () => {
  it("renders the logo, or initials without one", () => {
    render(<TeamLogo image={{ asset: {} }} name="Montana State" />);
    expect(screen.getByAltText("Montana State logo")).toBeInTheDocument();
    render(<TeamLogo image={null} name="Newcomer" size="md" />);
    expect(screen.getByText("NEWC")).toBeInTheDocument();
    render(<TeamLogo image={null} name="Newcomer" abbreviation="NU" />);
    expect(screen.getByText("NU")).toBeInTheDocument();
  });
});

describe("RatingsTable", () => {
  it("shows this week's reference points above the table", () => {
    render(
      <RatingsTable
        rows={rows()}
        poolName="FCS"
        benchmark={8.98}
        sort="sor"
        basePath="/b"
        teamHref={(slug) => slug}
      />,
    );
    expect(
      screen.getByText("How this week's numbers compare"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/these ratings usually is at season's end \(\+9\.0/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/#1 \+26\.0 · #10 −1\.0 · middle 0\.0/),
    ).toBeInTheDocument();
    expect(screen.getByText(/#1 <0\.1% · #25 —/)).toBeInTheDocument();
  });

  const renderTable = (
    sort: Parameters<typeof RatingsTable>[0]["sort"],
    dir: Parameters<typeof RatingsTable>[0]["dir"] = "asc",
  ) =>
    render(
      <RatingsTable
        rows={rows()}
        poolName="FCS"
        benchmark={8.98}
        sort={sort}
        dir={dir}
        basePath="/base"
        teamHref={(slug) => `/t/${slug}`}
      />,
    );

  it("explains every column and labels the pool record", () => {
    renderTable("sor");
    expect(screen.getByText("What these columns mean")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "vs FCS" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Remaining SOS" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Strength of record:/).length).toBeGreaterThan(
      0,
    );
  });

  it("links each sortable header and marks the current sort", () => {
    renderTable("sor");
    expect(screen.getByRole("link", { name: "SOR" })).toHaveAttribute(
      "href",
      "/base?sort=sor&dir=desc",
    );
    expect(screen.getByRole("columnheader", { name: "SOR" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("link", { name: "SOR" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: "SOS" })).toHaveAttribute(
      "href",
      "/base?sort=sos",
    );
    expect(screen.getByRole("link", { name: "Montana State" })).toHaveAttribute(
      "href",
      "/t/montana-state-bobcats",
    );
    const newcomer = screen.getAllByRole("row")[3]!;
    expect(within(newcomer).getByText("Newcomer").tagName).toBe("SPAN");
    expect(within(newcomer).getByText("small sample")).toBeInTheDocument();
  });

  it.each(["power", "sos", "sov", "record-sos", "remaining"] as const)(
    "renders rank by %s",
    (sort) => {
      renderTable(sort);
      const firstRow = screen.getAllByRole("row")[1]!;
      expect(within(firstRow).getAllByRole("cell")[0]?.textContent).toMatch(
        /^\d+$|^—$/,
      );
    },
  );

  it("flips a descending column back to the default sort", () => {
    renderTable("sos", "desc");
    expect(screen.getByRole("link", { name: "SOS" })).toHaveAttribute(
      "href",
      "/base",
    );
    expect(screen.getByRole("columnheader", { name: "SOS" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(screen.getByRole("link", { name: "SOR" })).toHaveAttribute(
      "href",
      "/base",
    );
  });

  it("keeps remaining-schedule ranks when reversed", () => {
    renderTable("remaining", "desc");
    const cells = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
    expect(cells).toEqual(["2", "1", "3"]);
  });

  it("numbers rows by position when sorting by remaining schedule", () => {
    renderTable("remaining");
    const cells = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[0]?.textContent);
    expect(cells).toEqual(["1", "2", "3"]);
  });

  it("shows a dash for a team with no pool games", () => {
    render(
      <RatingsTable
        rows={[teamRow({ sosRank: null, poolGames: 0 })]}
        poolName="FCS"
        benchmark={8.98}
        sort="sor"
        basePath="/b"
        teamHref={(slug) => slug}
      />,
    );
    expect(
      within(screen.getAllByRole("row")[1]!).getAllByText("—").length,
    ).toBeGreaterThan(0);
  });
});

describe("TeamSheet", () => {
  it("shows every metric, compact tiers with a legend, counted, remaining, and excluded games", () => {
    render(
      <TeamSheet
        row={teamRow()}
        poolName="FCS"
        teamCount={129}
        opponentHref={(id) => (id === "ndsu" ? "/t/ndsu" : null)}
        benchmark={8.42}
        sigma={14.6}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Montana State" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Big Sky · 14-1 vs FCS · 14-2 overall/),
    ).toBeInTheDocument();
    expect(screen.getByText("#12 of 129")).toBeInTheDocument();
    expect(
      screen.getByText("Would be favored over a #25-level team"),
    ).toBeInTheDocument();
    expect(screen.getByText("Record by opponent quality")).toBeInTheDocument();
    expect(screen.getByText("#25-level or better")).toBeInTheDocument();
    expect(screen.getByText("6-1")).toBeInTheDocument();
    expect(screen.getByText("FBS")).toBeInTheDocument();
    expect(screen.getByText("Non-NCAA")).toBeInTheDocument();
    expect(
      screen.getByText(/Opp\. 61\.0% · Opp\. opp\. 55\.0%/),
    ).toBeInTheDocument();
    expect(screen.getByText("W 35-34 OT")).toBeInTheDocument();
    expect(screen.getByText("L 10-17")).toBeInTheDocument();
    expect(screen.getByText("T 21-21")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "North Dakota State" })[0],
    ).toHaveAttribute("href", "/t/ndsu");
    expect(screen.getByText(/Not In Table/).tagName).toBe("TD");
    expect(
      screen.getByText(/Wk 12: vs North Dakota State · p 0\.810/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Not counted \(opponent not FCS\)/),
    ).toBeInTheDocument();
    expect(screen.getByText(/at Oregon · L 14-59/)).toBeInTheDocument();
    expect(screen.getByText(/vs Some D-II · W 50-0/)).toBeInTheDocument();
    expect(screen.getByText(/vs \(N\) Draw U · T 7-7/)).toBeInTheDocument();
    expect(screen.getByText(/Wk 1: vs Cancelled$/)).toBeInTheDocument();
  });

  it("can leave the tier legend to the page", () => {
    render(
      <TeamSheet
        row={teamRow()}
        poolName="FCS"
        teamCount={3}
        opponentHref={() => null}
        benchmark={8}
        sigma={14}
        showTierLegend={false}
      />,
    );
    expect(
      screen.queryByText("Would be favored over a #25-level team"),
    ).not.toBeInTheDocument();
    const { container } = render(<TierLegend />);
    expect(container).toHaveTextContent(
      "Tier 4, Weak:Beats a #25-level team under 10% of the time",
    );
  });

  it("handles a team with no conference, ranks, record SOS, or remaining or excluded games", () => {
    const row = rows()[1]!;
    render(
      <TeamSheet
        row={{ ...row, conference: null, sorRank: null, sovRank: null }}
        poolName="FCS"
        teamCount={129}
        opponentHref={() => null}
        benchmark={8.42}
        sigma={14.6}
      />,
    );
    expect(screen.getByText("Unranked: too few games")).toBeInTheDocument();
    expect(screen.getByText("12 wins")).toBeInTheDocument();
    expect(screen.queryByText(/Remaining FCS games/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Not counted/)).not.toBeInTheDocument();
    expect(screen.getByText(/^12-1-1 vs FCS/)).toBeInTheDocument();
  });

  it("falls back to 0 for a missing opponents' opponents percentage", () => {
    render(
      <TeamSheet
        row={teamRow({ oowp: null })}
        poolName="FCS"
        teamCount={3}
        opponentHref={() => null}
        benchmark={8}
        sigma={14}
      />,
    );
    expect(screen.getByText(/Opp\. opp\. 0\.0%/)).toBeInTheDocument();
  });
});

describe("TeamSheetPage", () => {
  it("links opponents to their latest sheets, the method, and the team page", () => {
    const model = teamModel();
    render(<TeamSheetPage data={{ model, row: model.rows[0]! }} />);
    expect(screen.getByText("FCS ratings · 2025 Postseason")).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs",
    );
    expect(
      screen.getAllByRole("link", { name: "North Dakota State" })[0],
    ).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs/teams/north-dakota-state-bison",
    );
    expect(
      screen.getByText("How every number here is computed"),
    ).toHaveAttribute("href", "/ratings/methodology");
    expect(screen.getByText("Montana State team page")).toHaveAttribute(
      "href",
      "/college/teams/montana-state-bobcats",
    );
  });

  it("links into the archive for an older week, and skips the team page without a slug", () => {
    const model = teamModel({ isLatest: false });
    render(<TeamSheetPage data={{ model, row: model.rows[2]! }} />);
    expect(screen.getByText("FCS ratings · 2025 Postseason")).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs/2025/postseason",
    );
    expect(
      screen.getAllByRole("link", { name: "North Dakota State" })[0],
    ).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs/2025/postseason/teams/north-dakota-state-bison",
    );
    expect(screen.queryByText(/team page/)).not.toBeInTheDocument();
  });
});

describe("RatingsWeekView", () => {
  it("renders the dataset JSON-LD, header, table, and run footer", () => {
    const { container } = render(
      <RatingsWeekView
        model={weekModel()}
        sort="sor"
        basePath="/college/football/ratings/fcs"
      />,
    );
    expect(
      container.querySelector("script#ratings-dataset")?.textContent,
    ).toContain('"@type":"Dataset"');
    expect(screen.getByRole("link", { name: "Montana State" })).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs/teams/montana-state-bobcats",
    );
    expect(
      screen.getByText(/Method v1 · 691 FCS games · run abcdef012345/),
    ).toBeInTheDocument();
  });

  it("links teams into the archived week when it isn't the latest", () => {
    render(
      <RatingsWeekView
        model={weekModel({ isLatest: false })}
        sort="sor"
        basePath="/x"
      />,
    );
    expect(screen.getByRole("link", { name: "Montana State" })).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs/2025/postseason/teams/montana-state-bobcats",
    );
  });
});

describe("RatingsMethodology", () => {
  const pool = {
    label: "FCS football",
    name: "FCS",
    anchor: "football-fcs",
    config,
    methodVersion: 1,
    ratingsHref: "/r",
    accuracyHref: "/a",
  };

  it("explains the method once and lists each pool's numbers", () => {
    render(
      <RatingsMethodology
        pools={[
          pool,
          {
            ...pool,
            label: "FBS football",
            anchor: "football-fbs",
            config: {
              ...config,
              marginTransform: { type: "log", c: 14 },
              powerHalfLifeWeeks: 6,
            },
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "How the ratings and strength of schedule work",
    );
    expect(screen.getByText(/don't use any poll/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FCS football" })).toHaveAttribute(
      "href",
      "/r",
    );
    expect(screen.getAllByText("14.60 points")).toHaveLength(2);
    expect(screen.getByText("28 points")).toBeInTheDocument();
    expect(screen.getByText("logarithmic")).toBeInTheDocument();
    expect(screen.getByText("every game counts equally")).toBeInTheDocument();
    expect(screen.getByText("half weight after 6 weeks")).toBeInTheDocument();
  });

  it("renders nothing without pools", () => {
    const { container } = render(<RatingsMethodology pools={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("RatingsAccuracy", () => {
  const summary = summarizePredictions([
    { year: 2026, seasonType: 2, weekNumber: 2, predicted: 10, actual: 7 },
    { year: 2026, seasonType: 2, weekNumber: 2, predicted: -2, actual: 3 },
    { year: 2025, seasonType: 3, weekNumber: 1, predicted: 25, actual: 30 },
  ]);

  it("shows this season, week by week, close games, every season, and champions", () => {
    render(
      <RatingsAccuracy
        poolName="FCS"
        summary={summary}
        report={validationReport("football", "fcs")}
        methodologyHref="/m"
        ratingsHref="/r"
      />,
    );
    expect(screen.getByText("2026 season")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 winners right")).toBeInTheDocument();
    expect(screen.getByText("2026 week by week")).toBeInTheDocument();
    expect(screen.getByText("Toss-up (under 3)")).toBeInTheDocument();
    expect(screen.queryByText("Close (3–7)")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/used to choose settings/),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("50% (coin flip)").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Where each champion finished"),
    ).toBeInTheDocument();
  });

  it("works without a report or champion data", () => {
    render(
      <RatingsAccuracy
        poolName="FCS"
        summary={summary}
        report={null}
        methodologyHref="/m"
        ratingsHref="/r"
      />,
    );
    expect(screen.getByText(/Every pick in every season/)).toBeInTheDocument();
    expect(
      screen.queryByText("Where each champion finished"),
    ).not.toBeInTheDocument();
  });

  it("handles an empty record and missing champion data", () => {
    render(
      <RatingsAccuracy
        poolName="FCS"
        summary={summarizePredictions([])}
        report={{
          ...validationReport("football", "fcs")!,
          championRanks: [
            {
              year: 2030,
              champion: null,
              sorRank: null,
              powerRank: null,
              sosRank: null,
            },
          ],
        }}
        methodologyHref="/m"
        ratingsHref="/r"
      />,
    );
    expect(screen.getByText("This season")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(4);
  });
});

describe("RatingsSkeleton", () => {
  it("announces loading", () => {
    render(<RatingsSkeleton />);
    expect(screen.getByLabelText("Loading ratings")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
