import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import type { PollHistorySeason } from "@/lib/poll-history-data";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@redshirt-sports/ui/components/select", () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => (
    <div>
      <button
        type="button"
        data-testid="year-select"
        onClick={() => onValueChange?.("2024")}
      >
        {value}
      </button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/rankings/team-page-link", () => ({
  TeamPageLink: ({ children, slug }: { children: ReactNode; slug: string }) => (
    <a href={`/college/teams/${slug}`}>{children}</a>
  ),
}));

import { RankingsHistoryWeekMatrix } from "@/components/rankings/rankings-history-week-matrix";

const activeSeason: PollHistorySeason = {
  year: 2025,
  weeks: [
    {
      week: 0,
      weekSegment: "preseason",
      weekLabel: "Preseason",
      teamId: "1",
      teamName: "Alabama",
      teamShortName: "BAMA",
      points: 25,
      pollHref: "/week-0",
    },
    {
      week: 1,
      weekSegment: "regular",
      weekLabel: "Week 1",
      teamId: "1",
      teamName: "Alabama",
      teamShortName: "BAMA",
      points: 25,
      pollHref: "/week-1",
    },
    {
      week: 2,
      weekSegment: "regular",
      weekLabel: "Week 2",
      teamId: "1",
      teamName: "Alabama",
      teamShortName: "BAMA",
      points: 25,
      pollHref: "/week-2",
    },
  ],
  teams: [
    {
      teamId: "1",
      teamSlug: "alabama",
      teamName: "Alabama Crimson Tide",
      teamShortName: "BAMA",
      ranks: [1, 10, 20],
      high: 1,
      low: 2,
      weeksRanked: 2,
    },
    {
      teamId: "2",
      teamSlug: "georgia",
      teamName: "Georgia Bulldogs",
      teamShortName: "UGA",
      ranks: [null, 1, null],
      high: null,
      low: null,
      weeksRanked: 1,
    },
  ],
};

describe("RankingsHistoryWeekMatrix", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders week headers, ranks, and filters teams by search", async () => {
    const user = userEvent.setup();
    render(
      <RankingsHistoryWeekMatrix
        sport="football"
        division="fbs"
        seasons={[{ year: 2025 }, { year: 2024 }]}
        activeSeason={activeSeason}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: "Pre" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BAMA" })).toHaveAttribute(
      "href",
      "/college/teams/alabama",
    );
    expect(screen.getByTitle("BAMA · Preseason: #1")).toHaveTextContent("1");

    await user.type(screen.getByLabelText("Find a team"), "georgia");
    expect(
      screen.queryByRole("link", { name: "BAMA" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "UGA" })).toBeInTheDocument();
  });

  it("navigates when the season changes", async () => {
    const user = userEvent.setup();
    render(
      <RankingsHistoryWeekMatrix
        sport="football"
        division="fbs"
        seasons={[{ year: 2025 }]}
        activeSeason={activeSeason}
      />,
    );

    await user.click(screen.getByTestId("year-select"));
    expect(mockPush).toHaveBeenCalledWith(
      "/college/football/rankings/fbs/history?year=2024",
    );
  });
});
