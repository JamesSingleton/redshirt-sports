import type { PollAttendance } from "@redshirt-sports/db/queries";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  excuse: vi.fn(),
  excuseAhead: vi.fn(),
  removeAhead: vi.fn(),
  reinstate: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/actions/attendance", () => ({
  excuseMissedBallot: mocks.excuse,
  excuseAhead: mocks.excuseAhead,
  reinstateVoter: mocks.reinstate,
  removeExcuseAhead: mocks.removeAhead,
}));

// Radix Select doesn't open in happy-dom; a native select keeps the flow testable.
vi.mock("@redshirt-sports/ui/components/select", async () => {
  const { Children, isValidElement } = await import("react");
  type Props = { children?: React.ReactNode };
  const SelectTrigger = (_: { id: string } & Props) => null;
  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange: (value: string) => void;
    } & Props) => {
      const trigger = Children.toArray(children).find(
        (child) => isValidElement(child) && child.type === SelectTrigger,
      ) as React.ReactElement<{ id: string }> | undefined;
      return (
        <select
          id={trigger?.props.id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        >
          <option value="" />
          {children}
        </select>
      );
    },
    SelectTrigger,
    SelectValue: () => null,
    SelectContent: ({ children }: Props) => <>{children}</>,
    SelectGroup: ({ children }: Props) => <>{children}</>,
    SelectItem: ({ value, children }: { value: string } & Props) => (
      <option value={value}>{children}</option>
    ),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));

import { MissedBallotsCard } from "@/components/missed-ballots-card";

const voter = (
  overrides: Partial<PollAttendance["voters"][number]> = {},
): PollAttendance["voters"][number] => ({
  userId: "user_1",
  firstName: "Pat",
  lastName: "Voter",
  organization: "Bobcat Radio",
  unexcusedCount: 1,
  lockedOut: false,
  lockedOutAt: null,
  misses: [
    {
      id: "miss_1",
      weekId: "week_1",
      label: "Week 3",
      excused: false,
      excuseNote: null,
      upcoming: false,
    },
  ],
  ...overrides,
});

const poll = (
  voters: PollAttendance["voters"],
  overrides: Partial<PollAttendance> = {},
): PollAttendance => ({
  pollId: "poll_1",
  pollName: "FCS Top 25",
  sportSlug: "football",
  year: 2026,
  limit: 3,
  voters,
  upcomingWeeks: [
    { id: "week_10", label: "Week 10" },
    { id: "week_11", label: "Week 11" },
  ],
  assignedVoters: [
    { userId: "user_1", firstName: "Pat", lastName: "Voter" },
    { userId: "user_2", firstName: "Sam", lastName: "Absent" },
  ],
  ...overrides,
});

describe("MissedBallotsCard", () => {
  afterEach(() => vi.clearAllMocks());

  it("says so when there are no active polls", () => {
    render(<MissedBallotsCard attendance={[]} />);
    expect(screen.getByText("No active polls.")).toBeInTheDocument();
  });

  it("gives each poll its own labeled panel, even with no misses", () => {
    render(
      <MissedBallotsCard
        attendance={[
          poll([], { pollId: "fbs", pollName: "FBS Top 25" }),
          poll([voter(), voter({ userId: "user_2", firstName: "Sam" })]),
        ]}
      />,
    );
    const fbs = screen.getByRole("region", { name: /FBS Top 25/ });
    const fcs = screen.getByRole("region", { name: /FCS Top 25/ });
    expect(within(fbs).getByText("No missed ballots")).toBeInTheDocument();
    expect(within(fbs).queryByText("Pat Voter")).not.toBeInTheDocument();
    expect(within(fcs).getByText("2 voters with misses")).toBeInTheDocument();
    expect(within(fcs).getByText("Pat Voter")).toBeInTheDocument();
  });

  it("summarizes voters near or at the limit", () => {
    render(
      <MissedBallotsCard
        attendance={[
          poll([
            voter({ unexcusedCount: 2 }),
            voter({ userId: "user_2", lockedOut: true, unexcusedCount: 3 }),
          ]),
        ]}
      />,
    );
    expect(
      screen.getByText(
        "2 voters with misses · 1 one miss from lockout · 1 locked out",
      ),
    ).toBeInTheDocument();
  });

  it("lists voters with their misses against the limit", () => {
    render(<MissedBallotsCard attendance={[poll([voter()])]} />);
    expect(screen.getByText("1 voter with misses")).toBeInTheDocument();
    expect(screen.getByText("Pat Voter")).toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week 3" })).toBeInTheDocument();
  });

  it("excuses a week with a note", async () => {
    mocks.excuse.mockResolvedValue(undefined);
    render(<MissedBallotsCard attendance={[poll([voter()])]} />);
    await userEvent.click(screen.getByRole("button", { name: "Week 3" }));
    await userEvent.type(screen.getByLabelText("Note (optional)"), "Traveling");
    await userEvent.click(screen.getByRole("button", { name: "Excuse" }));
    await waitFor(() =>
      expect(mocks.excuse).toHaveBeenCalledWith({
        id: "miss_1",
        excused: true,
        note: "Traveling",
      }),
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("can make an excused week count again", async () => {
    mocks.excuse.mockResolvedValue(undefined);
    const excused = voter({
      unexcusedCount: 0,
      misses: [
        {
          id: "miss_1",
          weekId: "week_1",
          label: "Week 3",
          excused: true,
          excuseNote: "Traveling",
          upcoming: false,
        },
      ],
    });
    render(<MissedBallotsCard attendance={[poll([excused])]} />);
    await userEvent.click(screen.getByRole("button", { name: "Week 3" }));
    expect(screen.getByLabelText("Note (optional)")).toHaveValue("Traveling");
    await userEvent.click(
      screen.getByRole("button", { name: "Count it again" }),
    );
    await waitFor(() =>
      expect(mocks.excuse).toHaveBeenCalledWith({
        id: "miss_1",
        excused: false,
        note: "Traveling",
      }),
    );
  });

  it("reinstates a locked-out voter", async () => {
    mocks.reinstate.mockResolvedValue(undefined);
    render(
      <MissedBallotsCard
        attendance={[poll([voter({ lockedOut: true, unexcusedCount: 3 })])]}
      />,
    );
    expect(screen.getByText("Locked out")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reinstate" }));
    await waitFor(() =>
      expect(mocks.reinstate).toHaveBeenCalledWith({
        pollId: "poll_1",
        userId: "user_1",
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "Pat Voter is back on FCS Top 25",
    );
  });

  it("shows an error when reinstating fails", async () => {
    mocks.reinstate.mockRejectedValue(new Error("nope"));
    render(
      <MissedBallotsCard attendance={[poll([voter({ lockedOut: true })])]} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Reinstate" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("nope"));
  });

  it("excuses a voter ahead of time for an upcoming week", async () => {
    mocks.excuseAhead.mockResolvedValue(undefined);
    render(<MissedBallotsCard attendance={[poll([])]} />);
    await userEvent.click(screen.getByRole("button", { name: "Excuse ahead" }));
    const excuse = screen.getByRole("button", { name: "Excuse" });
    expect(excuse).toBeDisabled();
    expect(screen.getByLabelText("Week")).toHaveValue("week_10");
    await userEvent.selectOptions(screen.getByLabelText("Voter"), "user_2");
    await userEvent.selectOptions(screen.getByLabelText("Week"), "week_11");
    await userEvent.type(
      screen.getByLabelText("Note (optional)"),
      "Out of town",
    );
    await userEvent.click(excuse);
    await waitFor(() =>
      expect(mocks.excuseAhead).toHaveBeenCalledWith({
        pollId: "poll_1",
        userId: "user_2",
        weekId: "week_11",
        note: "Out of town",
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "Excused Sam Absent for Week 11",
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("shows why excusing ahead failed", async () => {
    mocks.excuseAhead.mockRejectedValue(new Error("already have a ballot"));
    render(<MissedBallotsCard attendance={[poll([])]} />);
    await userEvent.click(screen.getByRole("button", { name: "Excuse ahead" }));
    await userEvent.selectOptions(screen.getByLabelText("Voter"), "user_1");
    await userEvent.click(screen.getByRole("button", { name: "Excuse" }));
    await waitFor(() =>
      expect(mocks.error).toHaveBeenCalledWith("already have a ballot"),
    );
  });

  it("can't excuse ahead with no upcoming week", () => {
    render(
      <MissedBallotsCard attendance={[poll([], { upcomingWeeks: [] })]} />,
    );
    expect(screen.getByRole("button", { name: "Excuse ahead" })).toBeDisabled();
  });

  it("marks an advance excuse and lets you remove it", async () => {
    mocks.removeAhead.mockResolvedValue(undefined);
    const away = voter({
      unexcusedCount: 0,
      misses: [
        {
          id: "miss_9",
          weekId: "week_10",
          label: "Week 10",
          excused: true,
          excuseNote: "Wedding",
          upcoming: true,
        },
      ],
    });
    render(<MissedBallotsCard attendance={[poll([away])]} />);
    expect(screen.getByText("1 excused ahead")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Week 10/ }));
    expect(screen.queryByText("Count it again")).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Remove excuse" }),
    );
    await waitFor(() =>
      expect(mocks.removeAhead).toHaveBeenCalledWith({ id: "miss_9" }),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "Removed Pat's excuse for Week 10",
    );
  });
});
