import type { SchoolRankingHistory } from "@redshirt-sports/db/utils/school-ranking-history";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { TeamRankingHistory } from "@/components/teams/team-ranking-history";

vi.mock("recharts", () => ({
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ReferenceLine: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@redshirt-sports/ui/components/chart", () => ({
  ChartContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}));

vi.mock("@redshirt-sports/ui/components/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value?: string;
    onValueChange?: (value: string | null) => void;
  }) => (
    <div data-testid="select" data-value={value}>
      <button type="button" onClick={() => onValueChange?.(null)}>
        Clear
      </button>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ children }: { children: ReactNode }) => <>{children}</>,
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
        ],
        2024: [],
      },
    },
  ],
};

describe("TeamRankingHistory cleared year select", () => {
  it("keeps the selected year when the select is cleared", () => {
    render(<TeamRankingHistory history={history} teamName="Alabama" />);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "2025");
  });
});
