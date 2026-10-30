import { fireEvent, render, screen } from "@testing-library/react";

import { BallotsMatrixPanel } from "@/components/rankings/ballots-matrix-panel";
import type { BallotsPageMatrix } from "@/lib/ballots-page-data";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/college/football/rankings/fcs/2026/week-8/ballots",
  useSearchParams: () => new URLSearchParams(),
}));

const matrix: BallotsPageMatrix = {
  voters: [
    {
      userId: "u1",
      slug: "ada-voter",
      label: "Ada Voter · Outlet",
      shortLabel: "A. Voter",
    },
  ],
  rows: [
    {
      teamId: "t1",
      name: "South Dakota State Jackrabbits",
      shortName: "South Dakota State",
      abbreviation: "SDSU",
      image: null,
      publishedRank: 3,
      points: 400,
      firstPlaceVotes: 2,
      isReceivingVotesOnly: false,
      ballotsOn: 1,
      rankMin: 3,
      rankMax: 3,
      cells: [{ rank: 3, isOutlier: false, isLeftOff: false }],
    },
  ],
  ballotsCounted: 1,
  panelSize: 1,
  unanimousTeamCount: 1,
  topFirstPlaceVotes: 2,
  outlierPickCount: 0,
  leftOffCount: 0,
};

describe("BallotsMatrixPanel mobile columns", () => {
  it("keeps the filter compact and toggles outliers from the row label", () => {
    replace.mockClear();
    render(<BallotsMatrixPanel matrix={matrix} highlightVoterIds={[]} />);

    expect(screen.getByText("Voters with outliers only")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("switch", { name: "Voters with outliers only" }),
    );

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0]?.[0]).toContain("outliers=1");
    expect(
      screen.getByRole("switch", { name: "Voters with outliers only" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the team name available and hides points below sm", () => {
    render(<BallotsMatrixPanel matrix={matrix} highlightVoterIds={[]} />);

    expect(screen.getAllByTitle("South Dakota State").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("columnheader", { name: "Pts" })).toHaveClass(
      "hidden",
      "sm:table-cell",
    );
    expect(screen.getByRole("columnheader", { name: "Team" })).toHaveClass(
      "border-r-0",
      "w-[7.25rem]",
    );
    expect(screen.getByLabelText("Ballot matrix")).toHaveClass(
      "overflow-y-clip",
      "overflow-x-auto",
      "min-w-0",
    );
  });

  it("tints the highlighted voter column and fades the other columns", () => {
    const firstVoter = matrix.voters[0];
    if (!firstVoter) {
      throw new Error("missing voter");
    }
    const { container } = render(
      <BallotsMatrixPanel
        matrix={{
          ...matrix,
          voters: [
            firstVoter,
            {
              userId: "u2",
              slug: "bea-voter",
              label: "Bea Voter",
              shortLabel: "B. Voter",
            },
          ],
          rows: matrix.rows.map((row) => ({
            ...row,
            cells: [
              ...row.cells,
              { rank: 12, isOutlier: true, isLeftOff: false },
            ],
          })),
        }}
        highlightVoterIds={["u1"]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "A. Voter" })).toHaveClass(
      "bg-primary/15",
    );
    expect(
      screen
        .getByRole("columnheader", { name: "B. Voter" })
        .querySelector("span"),
    ).toHaveClass("opacity-35");
    const highlightedCell = container.querySelector('td[data-voter-col="0"]');
    expect(highlightedCell).toHaveClass("bg-primary/10");
    expect(highlightedCell).not.toHaveClass("opacity-35");
    expect(highlightedCell?.querySelector("div")).not.toHaveClass(
      "ring-primary/60",
    );
    const otherCell = container.querySelector('td[data-voter-col="1"]');
    expect(otherCell).not.toHaveClass("opacity-35");
    expect(otherCell?.querySelector("div")).toHaveClass(
      "opacity-35",
      "ring-gold",
    );
    expect(screen.getByRole("columnheader", { name: "Team" })).toHaveClass(
      "z-30",
    );
  });

  it("marks a blank cell with a dash when the voter left a Top 25 team off", () => {
    const { container } = render(
      <BallotsMatrixPanel
        matrix={{
          ...matrix,
          rows: matrix.rows.map((row) => ({
            ...row,
            cells: [{ rank: null, isOutlier: false, isLeftOff: true }],
          })),
        }}
        highlightVoterIds={[]}
      />,
    );

    const omission = container.querySelector('td[data-voter-col="0"] div');
    expect(omission).toHaveClass("text-gold");
    expect(omission).not.toHaveClass("ring-gold");
    expect(
      screen.getByText("Left off the published Top 25"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Left off a Top 25 team/)).toBeInTheDocument();
  });

  it("paints the row and column hover on filled rank squares", () => {
    const { container } = render(
      <BallotsMatrixPanel matrix={matrix} highlightVoterIds={[]} />,
    );
    const cell = container.querySelector('td[data-voter-col="0"]');
    const rank = cell?.querySelector("div");
    if (!cell || !rank || !cell.parentElement) {
      throw new Error("missing rank cell");
    }

    fireEvent.mouseEnter(cell.parentElement);
    fireEvent.mouseEnter(cell);

    expect(rank.className).toContain("var(--accent)");
    expect(rank).toHaveClass("bg-heat-1");
  });
});
