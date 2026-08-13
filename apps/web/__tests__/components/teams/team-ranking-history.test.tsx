import type { SchoolRankingHistory } from "@redshirt-sports/db/utils/school-ranking-history";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TeamRankingHistory } from "@/components/teams/team-ranking-history";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("recharts", () => ({
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Line: ({
    dot: Dot,
  }: {
    dot?: React.ComponentType<{
      cx?: number;
      cy?: number;
      payload?: Record<string, unknown>;
    }>;
  }) => (
    <div data-testid="line-dot">
      {Dot ? (
        <>
          <Dot cx={10} cy={10} payload={{ rankValue: 1, status: "ranked" }} />
          <Dot cx={undefined} cy={10} payload={{ rankValue: 1 }} />
          <Dot cx={10} cy={undefined} payload={{ rankValue: 1 }} />
          <Dot cx={10} cy={10} payload={{ rankValue: null }} />
          <Dot cx={10} cy={10} payload={{ rankValue: 1, status: "rv" }} />
        </>
      ) : null}
    </div>
  ),
  LineChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => (
    <div data-testid="line-chart" data-points={data.length}>
      {children}
    </div>
  ),
  ReferenceLine: () => <div data-testid="reference-line" />,
  XAxis: () => null,
  YAxis: ({ tickFormatter }: { tickFormatter?: (value: number) => string }) => (
    <div data-testid="y-axis">
      {tickFormatter?.(25)}
      {tickFormatter?.(29)}
    </div>
  ),
}));

vi.mock("@redshirt-sports/ui/components/chart", () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltip: ({ content }: { content: React.ReactNode }) => (
    <div data-testid="chart-tooltip">{content}</div>
  ),
  ChartTooltipContent: ({
    formatter,
  }: {
    formatter?: (
      value: unknown,
      name: unknown,
      item: { payload?: Record<string, unknown> },
    ) => React.ReactNode;
  }) => (
    <div>
      {formatter?.(1, "rank", {
        payload: {
          status: "ranked",
          displayRank: "#1",
        },
      })}
      {formatter?.(1, "rank", {
        payload: {
          status: "rv",
          displayRank: "RV",
        },
      })}
      {formatter?.(1, "rank", {
        payload: {
          status: "out",
          displayRank: "NR",
        },
      })}
      {formatter?.(1, "rank", { payload: undefined })}
    </div>
  ),
}));

const history: SchoolRankingHistory = {
  polls: [
    {
      pollId: "poll-fbs",
      pollSlug: "fbs",
      pollName: "FBS",
      sportSlug: "football",
      sportTitle: "Football",
      years: [2025, 2024],
      seriesByYear: {
        2025: [
          {
            legacyWeek: 1,
            label: "Week 1",
            rank: 3,
            points: 1200,
            status: "ranked" as const,
          },
          {
            legacyWeek: 2,
            label: "Week 2",
            rank: null,
            points: 40,
            status: "rv" as const,
          },
        ],
        2024: [],
      },
    },
    {
      pollId: "poll-fcs",
      pollSlug: "fcs",
      pollName: "FCS",
      sportSlug: "football",
      sportTitle: "Football",
      years: [2025],
      seriesByYear: {
        2025: [
          {
            legacyWeek: 1,
            label: "Week 1",
            rank: 10,
            points: 500,
            status: "ranked" as const,
          },
        ],
      },
    },
  ],
};

describe("TeamRankingHistory", () => {
  it("returns null when there is no poll history", () => {
    const { container } = render(
      <TeamRankingHistory history={{ polls: [] }} teamName="Alabama" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a single poll chart with year selector and rankings link", async () => {
    const user = userEvent.setup();
    render(
      <TeamRankingHistory
        history={{ polls: [history.polls[0]!] }}
        teamName="Alabama"
      />,
    );

    expect(screen.getByText("Alabama Top 25 History")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toHaveAttribute(
      "data-points",
      "2",
    );
    expect(screen.getByRole("link", { name: "View rankings" })).toHaveAttribute(
      "href",
      "/college/football/rankings/fbs/2025/2",
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "2024" }));
    expect(
      screen.getByText("No published rankings for Alabama in 2024."),
    ).toBeInTheDocument();
  });

  it("renders tabs when multiple polls are available", async () => {
    const user = userEvent.setup();
    render(<TeamRankingHistory history={history} teamName="Alabama" />);

    expect(
      screen.getByRole("tab", { name: "Football FBS" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Football FCS" }));
    expect(screen.getByText("Latest #10")).toBeInTheDocument();
  });

  it("uses a rankings index link when no latest week is available", () => {
    render(
      <TeamRankingHistory
        history={{
          polls: [
            {
              pollId: "poll-fbs",
              pollSlug: "fbs",
              pollName: "FBS",
              sportSlug: "football",
              sportTitle: "Football",
              years: [2025],
              seriesByYear: {
                2025: [
                  {
                    legacyWeek: 1,
                    label: "Week 1",
                    rank: null,
                    points: null,
                    status: "out" as const,
                  },
                ],
              },
            },
          ],
        }}
        teamName="Alabama"
      />,
    );

    expect(screen.getByRole("link", { name: "View rankings" })).toHaveAttribute(
      "href",
      "/college/football/rankings/fbs",
    );
    expect(screen.getByText("Latest NR")).toBeInTheDocument();
    expect(screen.queryByText(/Peak #/)).not.toBeInTheDocument();
  });

  it("renders a single-year label when only one season exists", () => {
    render(
      <TeamRankingHistory
        history={{
          polls: [
            {
              pollId: "poll-fbs",
              pollSlug: "fbs",
              pollName: "FBS",
              sportSlug: "football",
              sportTitle: "Football",
              years: [2025],
              seriesByYear: {
                2025: [
                  {
                    legacyWeek: 1,
                    label: "Week 1",
                    rank: 4,
                    points: 900,
                    status: "ranked" as const,
                  },
                ],
              },
            },
          ],
        }}
        teamName="Alabama"
      />,
    );

    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("keeps the earliest peak when later ranked weeks are worse", () => {
    render(
      <TeamRankingHistory
        history={{
          polls: [
            {
              pollId: "poll-fbs",
              pollSlug: "fbs",
              pollName: "FBS",
              sportSlug: "football",
              sportTitle: "Football",
              years: [2025],
              seriesByYear: {
                2025: [
                  {
                    legacyWeek: 1,
                    label: "Week 1",
                    rank: 3,
                    points: 1200,
                    status: "ranked" as const,
                  },
                  {
                    legacyWeek: 2,
                    label: "Week 2",
                    rank: 8,
                    points: 800,
                    status: "ranked" as const,
                  },
                ],
              },
            },
          ],
        }}
        teamName="Alabama"
      />,
    );

    expect(screen.getByText("Peak #3")).toBeInTheDocument();
    expect(screen.getByText("Latest #8")).toBeInTheDocument();
  });

  it("handles polls with no years and missing series entries", () => {
    render(
      <TeamRankingHistory
        history={{
          polls: [
            {
              pollId: "poll-empty",
              pollSlug: "fbs",
              pollName: "FBS",
              sportSlug: "football",
              sportTitle: "Football",
              years: [],
              seriesByYear: {},
            },
          ],
        }}
        teamName="Alabama"
      />,
    );

    expect(
      screen.getByText("No published rankings for Alabama in ."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View rankings" })).toHaveAttribute(
      "href",
      "/college/football/rankings/fbs",
    );
  });
});
