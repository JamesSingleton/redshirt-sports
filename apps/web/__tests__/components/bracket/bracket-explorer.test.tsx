import { buildBracketView } from "@redshirt-sports/db/playoff-bracket";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import {
  bracketSlots,
  bracketStats,
  bracketView,
  FCS_SPEC,
} from "@/__tests__/helpers/bracket-fixtures";

const mockIsMobile = vi.hoisted(() => vi.fn(() => false));

vi.mock("@redshirt-sports/ui/hooks/use-mobile", () => ({
  useIsMobile: mockIsMobile,
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/components/bracket/matchup-panel", () => ({
  MatchupPanel: ({ game }: { game: { key: string } }) => (
    <div data-testid="panel">{game.key}</div>
  ),
}));

import { BracketExplorer } from "@/components/bracket/bracket-explorer";

function renderExplorer(view = bracketView()) {
  return render(
    <BracketExplorer
      view={view}
      stats={bracketStats()}
      sport="football"
      division="fcs"
    />,
  );
}

describe("BracketExplorer", () => {
  beforeEach(() => {
    window.history.replaceState(
      null,
      "",
      "/college/football/playoffs/fcs/2026",
    );
    mockIsMobile.mockReturnValue(false);
  });

  it("opens a game in a side sheet and keeps it in the URL", async () => {
    renderExplorer();
    expect(screen.queryByTestId("panel")).toBeNull();

    const card = screen.getByRole("button", {
      name: "First round: No. 16 School 16 vs School 24, at School 16",
    });
    await userEvent.click(card);

    expect(await screen.findByTestId("panel")).toHaveTextContent("r1-16");
    expect(
      screen.getByRole("dialog", { name: "School 16 vs. School 24" }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe("?game=r1-16");
    expect(card).toHaveAttribute("aria-pressed", "true");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByTestId("panel")).toBeNull());
    expect(window.location.search).toBe("");
  });

  it("opens a linked game on load and names an undecided side", async () => {
    window.history.replaceState(null, "", "?game=r2-1");
    renderExplorer();
    expect(await screen.findByTestId("panel")).toHaveTextContent("r2-1");
    expect(
      screen.getByRole("dialog", {
        name: "School 1 vs. Winner: S16 / S24",
      }),
    ).toBeInTheDocument();
  });

  it("ignores a link to a game the bracket doesn't have", () => {
    window.history.replaceState(null, "", "?game=nope");
    renderExplorer();
    expect(screen.queryByTestId("panel")).toBeNull();
  });

  it("uses a bottom drawer on phones", async () => {
    mockIsMobile.mockReturnValue(true);
    renderExplorer();
    await userEvent.click(
      screen.getByRole("button", { name: "Championship: TBD vs TBD" }),
    );
    expect(await screen.findByTestId("panel")).toHaveTextContent("final");
    expect(
      document.querySelector("[data-slot='drawer-content']"),
    ).not.toBeNull();
  });

  it("reads a finished game's scores and status in its label", () => {
    renderExplorer(
      buildBracketView(FCS_SPEC, bracketSlots(), [
        {
          gameKey: "r1-16",
          homeSide: null,
          siteLabel: "Greene Stadium",
          kickoffAt: null,
          status: "final",
          sideAScore: 14,
          sideBScore: 31,
          winnerSide: "b",
        },
      ]),
    );
    expect(
      screen.getByRole("button", {
        name: "First round: No. 16 School 16 14 vs School 24 31, Final, Greene Stadium",
      }),
    ).toBeInTheDocument();
  });

  it("titles a team without a short name by its full name", async () => {
    const slots = bracketSlots();
    slots[15]!.team.shortName = null;
    renderExplorer(buildBracketView(FCS_SPEC, slots, []));
    await userEvent.click(
      screen.getByRole("button", {
        name: "First round: No. 16 School 16 University vs School 24, at School 16 University",
      }),
    );
    expect(
      await screen.findByRole("dialog", {
        name: "School 16 University vs. School 24",
      }),
    ).toBeInTheDocument();
  });
});
