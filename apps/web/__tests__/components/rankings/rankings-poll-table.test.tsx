import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  type PollTableTeam,
  RankingsPollTable,
  teamWeekDetails,
} from "@/components/rankings/rankings-poll-table";

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => null,
}));

function team(overrides: Partial<PollTableTeam> = {}): PollTableTeam {
  return {
    _id: "t1",
    rank: 3,
    _points: 507,
    name: "South Dakota State",
    shortName: "South Dakota State",
    abbreviation: "SDSU",
    slug: "south-dakota-state",
    image: null,
    firstPlaceVotes: 1,
    movement: { kind: "up", delta: 1 },
    previousRank: 4,
    ballotsListed: 22,
    ...overrides,
  };
}

describe("teamWeekDetails", () => {
  it("describes the team's week", () => {
    expect(teamWeekDetails(team(), 22)).toEqual([
      "507 points",
      "1 first-place vote",
      "Up 1 from No. 4",
      "On 22 of 22 ballots",
    ]);
  });

  it("covers every kind of movement", () => {
    const lastWeek = (overrides: Partial<PollTableTeam>) =>
      teamWeekDetails(team({ firstPlaceVotes: 0, ...overrides }), 1);
    expect(lastWeek({ movement: { kind: "down", delta: 2 } })).toEqual([
      "507 points",
      "Down 2 from No. 4",
      "On 22 of 1 ballot",
    ]);
    expect(lastWeek({ movement: { kind: "same" } })[1]).toBe(
      "No. 4 last week too",
    );
    expect(lastWeek({ movement: { kind: "nr" } })[1]).toBe(
      "Unranked last week",
    );
    expect(lastWeek({ movement: null, previousRank: null })[1]).toBe(
      "Unranked last week",
    );
    expect(lastWeek({ _points: 1, movement: null })[0]).toBe("1 point");
  });
});

describe("RankingsPollTable", () => {
  it("previews a team on hover and still links to its page", async () => {
    const user = userEvent.setup();
    render(
      <RankingsPollTable
        teams={[team(), team({ _id: "t2", slug: null, name: "No Page U" })]}
        ballotsCounted={22}
        methodologyHref="/methodology"
      />,
    );

    const link = screen.getByRole("link", { name: "South Dakota State" });
    expect(link).toHaveAttribute("href", "/college/teams/south-dakota-state");
    await user.hover(link);
    expect(await screen.findByText("Up 1 from No. 4")).toBeVisible();
    expect(screen.queryByRole("link", { name: "No Page U" })).toBeNull();
  });
});
