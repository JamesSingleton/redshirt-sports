import type {
  BracketGameView,
  BracketTeamStatsSet,
  BracketView,
} from "@redshirt-sports/db/playoff-bracket";
import { buildBracketView } from "@redshirt-sports/db/playoff-bracket";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  bracketSlots,
  bracketStats,
  FCS_SPEC,
} from "@/__tests__/helpers/bracket-fixtures";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { MatchupPanel } from "@/components/bracket/matchup-panel";

function gamesOf(view: BracketView) {
  return new Map<string, BracketGameView>(
    [
      ...view.left.columns.flatMap((column) => column.games),
      ...view.right.columns.flatMap((column) => column.games),
      view.final,
    ].map((game) => [game.key, game]),
  );
}

function renderPanel(
  key: string,
  view: BracketView,
  stats: BracketTeamStatsSet = bracketStats(),
) {
  const games = gamesOf(view);
  return render(
    <MatchupPanel
      game={games.get(key)!}
      games={games}
      stats={stats}
      sport="football"
      division="fcs"
    />,
  );
}

function rowOf(label: string) {
  return within(screen.getByText(label).closest("tr")!);
}

describe("MatchupPanel", () => {
  it("shows a final rematch with scores, comparison, notes and recent results", () => {
    const slots = bracketSlots();
    for (const slot of slots) {
      slot.bidLabel = "MVFC";
      slot.bidType = slot.slotKey === "seed-16" ? "auto" : "at-large";
    }
    const view = buildBracketView(FCS_SPEC, slots, [
      {
        gameKey: "r1-16",
        homeSide: null,
        siteLabel: null,
        kickoffAt: null,
        status: "final",
        sideAScore: 14,
        sideBScore: 31,
        winnerSide: "b",
      },
    ]);
    renderPanel("r1-16", view);

    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.getByText("at School 16")).toBeInTheDocument();
    expect(screen.getByText("MVFC · Auto bid · 6-2")).toBeInTheDocument();
    expect(screen.getByText("MVFC · At-large · 6-2")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "School 16" })).toHaveAttribute(
      "href",
      "/college/teams/school-16",
    );

    // Each comparison column is headed by its team.
    expect(
      screen.getByRole("columnheader", { name: /S16/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /S24/ }),
    ).toBeInTheDocument();
    expect(rowOf("Record").getAllByText("6-2")).toHaveLength(2);
    expect(rowOf("Top 25").getByText("#16")).toHaveClass("font-semibold");
    expect(rowOf("Top 25").getByText("NR")).not.toHaveClass("font-semibold");
    expect(rowOf("Strength of record").getByText("#12")).toHaveClass(
      "font-semibold",
    );

    expect(
      screen.getByText("Rematch: School 24 won 31-14 in overtime on Oct 3."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Conference matchup: both teams play in the MVFC."),
    ).toBeInTheDocument();
    expect(screen.getByText("School 16: last 5")).toBeInTheDocument();
    expect(screen.getAllByText("14-31*")).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Redshirt Top 25" }),
    ).toHaveAttribute("href", "/college/football/rankings/fcs");
    expect(
      screen.getByText(/through Week 8, ranked among 128 teams/),
    ).toBeInTheDocument();
  });

  it("hosts the bye seed and lists who could fill the open side", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), [
      {
        gameKey: "r1-16",
        homeSide: null,
        siteLabel: "Greene Stadium",
        kickoffAt: new Date("2026-11-28T19:00:00Z"),
        status: "scheduled",
        sideAScore: null,
        sideBScore: null,
        winnerSide: null,
      },
      {
        gameKey: "r2-1",
        homeSide: null,
        siteLabel: null,
        kickoffAt: new Date("2026-12-05T19:00:00Z"),
        status: "scheduled",
        sideAScore: null,
        sideBScore: null,
        winnerSide: null,
      },
    ]);
    renderPanel("r2-1", view);

    expect(
      screen.getByText(/Saturday, Dec 5, 2:00 PM EST/),
    ).toBeInTheDocument();
    expect(screen.getByText("at School 1")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "TBD" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Winner of the first round game on Nov 28:"),
    ).toBeInTheDocument();
    expect(screen.getByText("16. School 16")).toBeInTheDocument();
    expect(screen.getByText("School 24")).toBeInTheDocument();
    // Only one side is known, so nothing is compared or bolded.
    expect(rowOf("Power").getByText("#3")).not.toHaveClass("font-semibold");
    expect(rowOf("Top 25").getByText("—")).toBeInTheDocument();
    expect(screen.queryByText(/Rematch/)).toBeNull();
  });

  it("handles an undecided neutral final and missing stats", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), []);
    renderPanel("final", view, {
      asOf: { pollWeek: null, ratingsWeek: null, ratingsPoolSize: null },
      teams: {},
    });
    expect(screen.getByText("Date and time TBA")).toBeInTheDocument();
    expect(screen.getByText("Neutral site")).toBeInTheDocument();
    expect(screen.queryByText("Compare")).toBeNull();
    expect(screen.queryByText(/last 5/)).toBeNull();
  });

  it("prefers an entered site and compares teams outside the poll", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), [
      {
        gameKey: "r1-9",
        homeSide: "b",
        siteLabel: null,
        kickoffAt: null,
        status: "scheduled",
        sideAScore: null,
        sideBScore: null,
        winnerSide: null,
      },
    ]);
    const stats = bracketStats();
    const base = stats.teams["school-24"]!;
    stats.teams["school-9"] = {
      ...base,
      schoolId: "school-9",
      record: { wins: 0, losses: 0 },
      results: [],
      ratings: null,
    };
    stats.teams["school-17"] = {
      ...base,
      schoolId: "school-17",
      record: { wins: 5, losses: 1 },
      results: [],
      ratings: { powerRank: 30, sorRank: null, sosRank: 30 },
    };
    stats.asOf = { pollWeek: 8, ratingsWeek: 8, ratingsPoolSize: null };
    renderPanel("r1-9", view, stats);

    expect(screen.getByText("at School 17")).toBeInTheDocument();
    expect(rowOf("Record").getByText("5-1")).toHaveClass("font-semibold");
    expect(rowOf("Top 25").getAllByText("NR")).toHaveLength(2);
    expect(rowOf("Power").getByText("—")).toBeInTheDocument();
    expect(screen.getAllByText("No games yet.")).toHaveLength(2);
    expect(screen.getByText(/through Week 8\./)).toBeInTheDocument();
  });

  it("orders recent results newest first and marks road and neutral games", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), []);
    const stats = bracketStats();
    stats.teams["school-1"]!.results.push({
      gameId: "a2",
      kickoffAt: new Date("2026-10-10T19:00:00Z"),
      opponentSchoolId: null,
      opponentName: "Lamar",
      opponentLevel: "FCS",
      site: "neutral",
      teamScore: 20,
      opponentScore: 21,
      won: false,
      overtime: false,
    });
    renderPanel("r2-1", view, stats);
    const items = screen
      .getByText("School 1: last 5")
      .parentElement!.querySelectorAll("li");
    expect(items[0]).toHaveTextContent("vs. Lamar");
    expect(items[1]).toHaveTextContent("at Tusculum");
  });

  it("covers the other side winning, poll ties, missing names and sites", () => {
    const slots = bracketSlots();
    slots[0]!.team.shortName = null; // seed 1: falls back to its full name
    slots[15]!.team.shortName = null;
    slots[15]!.team.name = null; // seed 16: no name at all
    const view = buildBracketView(FCS_SPEC, slots, []);
    const stats = bracketStats();
    // Seed 16 won the meeting this time, in regulation, on an unknown date.
    stats.teams["school-16"]!.results[0] = {
      ...stats.teams["school-16"]!.results[0]!,
      won: true,
      overtime: false,
      kickoffAt: null,
    };
    stats.teams["school-16"]!.record = { wins: 7, losses: 1 };
    stats.teams["school-24"]!.poll = {
      rank: 16,
      points: 258,
      firstPlaceVotes: 0,
      isTie: true,
    };
    stats.asOf = { pollWeek: null, ratingsWeek: 8, ratingsPoolSize: 128 };
    renderPanel("r1-16", view, stats);

    expect(screen.getByText("at Team")).toBeInTheDocument();
    expect(
      screen.getByText("Rematch: Team won 31-14 on ."),
    ).toBeInTheDocument();
    expect(rowOf("Record").getByText("7-1")).toHaveClass("font-semibold");
    expect(rowOf("Top 25").getAllByText("#16")[0]).not.toHaveClass(
      "font-semibold",
    );
    expect(screen.queryByRole("link", { name: "Redshirt Top 25" })).toBeNull();
  });

  it("bolds the other side's poll rank and hides ratings it doesn't have", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), []);
    const stats = bracketStats();
    stats.teams["school-24"]!.poll = {
      rank: 9,
      points: 300,
      firstPlaceVotes: 0,
      isTie: false,
    };
    stats.asOf = { pollWeek: 8, ratingsWeek: null, ratingsPoolSize: null };
    renderPanel("r1-16", view, stats);
    expect(rowOf("Top 25").getByText("#9")).toHaveClass("font-semibold");
    expect(screen.queryByRole("link", { name: "Computer ratings" })).toBeNull();
  });

  it("shows TBA for an undecided game with no host and unknown feeders", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), []);
    renderPanel("qf-1", view);
    expect(screen.getByText("Site TBA")).toBeInTheDocument();
  });

  it("lists a possible team even without its stats", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), []);
    const stats = bracketStats();
    delete stats.teams["school-24"];
    const { container } = renderPanel("r2-1", view, stats);
    expect(screen.getByText("School 24")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("School 246");
  });

  it("heads a column with the full name when a team has no abbreviation", () => {
    const slots = bracketSlots();
    slots[0]!.team.shortName = null;
    slots[0]!.team.abbreviation = null;
    renderPanel("r2-1", buildBracketView(FCS_SPEC, slots, []));
    expect(
      screen.getByRole("columnheader", { name: "School 1 University" }),
    ).toBeInTheDocument();
  });

  it("names no site when the chosen host is still undecided", () => {
    const view = buildBracketView(FCS_SPEC, bracketSlots(), [
      {
        gameKey: "r2-1",
        homeSide: "b",
        siteLabel: null,
        kickoffAt: null,
        status: "scheduled",
        sideAScore: null,
        sideBScore: null,
        winnerSide: null,
      },
    ]);
    renderPanel("r2-1", view);
    expect(screen.getByText("Site TBA")).toBeInTheDocument();
  });
});
