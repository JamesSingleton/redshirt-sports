import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockLoadVoterBreakdown } = vi.hoisted(() => ({
  mockLoadVoterBreakdown: vi.fn(),
}));

vi.mock("@/actions/load-voter-breakdown", () => ({
  loadVoterBreakdown: mockLoadVoterBreakdown,
}));

vi.mock("@/components/rankings/voter-ballot-breakdown", () => ({
  __esModule: true,
  default: ({ voterBreakdown }: { voterBreakdown: unknown[] }) => (
    <div data-testid="voter-breakdown">{voterBreakdown.length}</div>
  ),
}));

vi.mock("@/components/rankings/voter-breakdown-skeleton", () => ({
  VoterBreakdownSkeleton: () => <div data-testid="voter-skeleton" />,
}));

import { LazyVoterBreakdown } from "@/components/rankings/lazy-voter-breakdown";

describe("LazyVoterBreakdown", () => {
  const props = {
    division: "fbs",
    year: 2025,
    week: 1,
    sport: "football" as const,
    consensusRanks: [{ id: "team-1", rank: 1 }],
  };

  beforeEach(() => {
    mockLoadVoterBreakdown.mockReset();
  });

  it("shows a button to load voter ballots initially", () => {
    render(<LazyVoterBreakdown {...props} />);
    expect(
      screen.getByRole("button", { name: "View voter ballots" }),
    ).toBeInTheDocument();
  });

  it("shows a skeleton while loading, then the breakdown on success", async () => {
    const user = userEvent.setup();
    let resolveLoad: (value: unknown) => void = () => {};
    mockLoadVoterBreakdown.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );

    render(<LazyVoterBreakdown {...props} />);
    await user.click(
      screen.getByRole("button", { name: "View voter ballots" }),
    );

    expect(screen.getByTestId("voter-skeleton")).toBeInTheDocument();

    resolveLoad([
      {
        name: "Voter One",
        organization: "Media",
        organizationRole: "Writer",
        ballot: [],
        matchPercent: 90,
      },
    ]);

    await waitFor(() => {
      expect(screen.getByTestId("voter-breakdown")).toHaveTextContent("1");
    });
    expect(mockLoadVoterBreakdown).toHaveBeenCalledWith(props);
  });

  it("renders nothing when the breakdown is null", async () => {
    const user = userEvent.setup();
    mockLoadVoterBreakdown.mockResolvedValue(null);

    const { container } = render(<LazyVoterBreakdown {...props} />);
    await user.click(
      screen.getByRole("button", { name: "View voter ballots" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "View voter ballots" }),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("voter-breakdown")).not.toBeInTheDocument();
    expect(container.querySelector(".mt-8")).toBeNull();
  });

  it("shows an error and allows retry after a failed load", async () => {
    const user = userEvent.setup();
    mockLoadVoterBreakdown
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce([
        {
          name: "Voter One",
          organization: "Media",
          organizationRole: "Writer",
          ballot: [],
          matchPercent: 90,
        },
      ]);

    render(<LazyVoterBreakdown {...props} />);
    await user.click(
      screen.getByRole("button", { name: "View voter ballots" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Unable to load voter ballots. Please try again."),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByTestId("voter-breakdown")).toHaveTextContent("1");
    });
    expect(mockLoadVoterBreakdown).toHaveBeenCalledTimes(2);
  });
});
