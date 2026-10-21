import { render, screen } from "@testing-library/react";

import { RankingsWeekPageBody } from "@/components/rankings/rankings-week-page-body";
import type { RankingsWeekPageModel } from "@/lib/rankings/read-model/week-page-model";

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
}));

vi.mock("@/components/rankings/rankings-poll-table", () => ({
  RankingsPollTable: () => <div data-testid="poll-table" />,
}));

function baseModel(
  overrides: Partial<RankingsWeekPageModel> = {},
): RankingsWeekPageModel {
  return {
    jsonLd: { "@context": "https://schema.org", "@graph": [] },
    ballotsCounted: 2,
    voterWord: "voters",
    ballotWord: "ballots",
    titleWeek: "Week 1",
    top25Count: 1,
    pollTableTeams: [],
    biggestMovers: [],
    moversSubtitle: "Week 1",
    ballotsHref: "/ballots",
    byVoterHref: "/ballots/by-voter",
    methodologyHref: "/methodology",
    voterChips: [],
    outsideTop25: [],
    droppedOutOfTop25: [],
    noLongerReceivingVotes: [],
    currentRankingsById: new Map(),
    ballotsListedBySanityId: {},
    sport: "football",
    division: "fbs",
    year: "2025",
    weekSegment: "1",
    ...overrides,
  };
}

describe("RankingsWeekPageBody", () => {
  it("renders the empty poll state", () => {
    render(<RankingsWeekPageBody model={baseModel({ top25Count: 0 })} />);

    expect(screen.getByText("Top 25 Poll Not Found")).toBeInTheDocument();
  });

  it("renders poll content when teams exist", () => {
    render(<RankingsWeekPageBody model={baseModel()} />);

    expect(screen.getByTestId("poll-table")).toBeInTheDocument();
    expect(screen.getByText(/2 voters/)).toBeInTheDocument();
  });
});
