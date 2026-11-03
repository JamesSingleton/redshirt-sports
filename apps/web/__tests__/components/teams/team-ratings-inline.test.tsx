import type { TeamRatingsHistory } from "@redshirt-sports/db/ratings";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { TeamRatingsInline } from "@/components/teams/team-ratings-inline";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="chart">{children}</div>
  ),
  Line: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="line">{dataKey}</div>
  ),
  XAxis: ({ tickFormatter }: { tickFormatter: (label: string) => string }) => (
    <div data-testid="x-tick">{tickFormatter("Week 3")}</div>
  ),
  YAxis: () => null,
}));

vi.mock("@redshirt-sports/ui/components/chart", () => ({
  ChartContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ChartLegend: () => null,
  ChartLegendContent: () => null,
  ChartTooltip: ({ content }: { content: ReactNode }) => <div>{content}</div>,
  ChartTooltipContent: ({
    formatter,
  }: {
    formatter: (value: number, name: string) => string;
  }) => <div data-testid="tooltip">{formatter(4, "sorRank")}</div>,
}));

const week = {
  segment: "1",
  label: "Week 1",
  sor: 0.42,
  sorRank: 9,
  power: 12.3,
  powerRank: 7,
  sos: 0.61,
  sosRank: 20,
};

function history(
  weeks: TeamRatingsHistory["weeks"] = [
    week,
    { ...week, segment: "2", label: "Week 2", sorRank: 5 },
  ],
): TeamRatingsHistory {
  return {
    pool: { slug: "fcs", name: "FCS", sportSlug: "football" },
    year: 2026,
    teamCount: 128,
    weeks,
  };
}

describe("TeamRatingsInline", () => {
  it("shows the latest ranks, a two-line trend, and links to the sheet", () => {
    render(<TeamRatingsInline ratings={history()} teamSlug="montana" />);
    expect(
      screen.getByText("FCS computer ratings · 2026 Week 2"),
    ).toBeInTheDocument();
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.getByText("#7")).toBeInTheDocument();
    expect(screen.getByText("#20")).toBeInTheDocument();
    expect(screen.getByText("+12.3 pts · of 128")).toBeInTheDocument();
    expect(
      screen.getAllByTestId("line").map((line) => line.textContent),
    ).toEqual(["sorRank", "powerRank"]);
    expect(screen.getByTestId("x-tick")).toHaveTextContent("W3");
    expect(screen.getByTestId("tooltip")).toHaveTextContent("SOR rank #4");
    expect(screen.getByText("Full team sheet")).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs/teams/montana",
    );
    expect(screen.getByText("All ratings")).toHaveAttribute(
      "href",
      "/college/football/ratings/fcs",
    );
  });

  it("skips the chart for one week, unranked stats, and the sheet link without a slug", () => {
    render(
      <TeamRatingsInline
        ratings={history([{ ...week, sorRank: null, sosRank: null }])}
        teamSlug={null}
      />,
    );
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText("Full team sheet")).not.toBeInTheDocument();
  });

  it("renders nothing without a published week", () => {
    const { container } = render(
      <TeamRatingsInline ratings={history([])} teamSlug="montana" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
