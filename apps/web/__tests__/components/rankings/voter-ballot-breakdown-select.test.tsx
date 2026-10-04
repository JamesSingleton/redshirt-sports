import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () =>
    function VoterRows({ rows }: { rows: Array<{ name: string }> }) {
      return (
        <ul>
          {rows.map((row) => (
            <li key={row.name}>{row.name}</li>
          ))}
        </ul>
      );
    },
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

const voterBreakdown = [
  {
    name: "Voter A",
    organization: "Org A",
    organizationRole: "Writer",
    matchPercent: 90,
    ballot: [],
  },
];

describe("VoterBallotBreakdown cleared selects", () => {
  it("keeps the current sort and page size when a select is cleared", async () => {
    render(
      <VoterBallotBreakdown
        voterBreakdown={voterBreakdown as never}
        teams={{} as never}
      />,
    );

    const clearButtons = await screen.findAllByRole("button", {
      name: "Clear",
    });
    for (const button of clearButtons) fireEvent.click(button);

    const selects = screen.getAllByTestId("select");
    expect(selects[0]).toHaveAttribute("data-value", "name");
    expect(selects[1]).toHaveAttribute("data-value", "10");
  });
});
