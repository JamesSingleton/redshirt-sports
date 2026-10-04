import { render, screen } from "@testing-library/react";

import { PollAside } from "@/components/rankings/poll-aside";

vi.mock("@/components/rankings/top25-card", () => ({
  DivisionTop25Card: ({ division }: { division: string }) => (
    <div data-testid="division-card">{division}</div>
  ),
  DivisionTop25CardSkeleton: () => <div data-testid="division-skeleton" />,
  Top25Card: () => <div data-testid="top25-card" />,
  Top25CardSkeleton: () => <div data-testid="top25-skeleton" />,
  isPollDivision: (value: string) => ["fcs", "fbs", "d2", "d3"].includes(value),
}));

vi.mock("@/components/suspense-reveal", () => ({
  SuspenseReveal: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("PollAside", () => {
  it("renders nothing for non-football sports", () => {
    const { container } = render(<PollAside sport="basketball" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for divisions without a poll", () => {
    const { container } = render(
      <PollAside sport="football" division="naia" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the division poll for a poll division", () => {
    render(<PollAside sport="football" division="fcs" />);
    expect(screen.getByTestId("division-card")).toHaveTextContent("fcs");
  });

  it("renders the tabbed poll card on the sport page", () => {
    render(<PollAside sport="football" />);
    expect(screen.getByTestId("top25-card")).toBeInTheDocument();
  });
});
