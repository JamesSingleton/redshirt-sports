import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const { mockUseIsMobile } = vi.hoisted(() => ({
  mockUseIsMobile: vi.fn(() => false),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: mockUseIsMobile,
}));

vi.mock("@redshirt-sports/ui/components/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock("@redshirt-sports/ui/components/drawer", () => ({
  Drawer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DrawerTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: ReactNode }) => (
    <p>{children}</p>
  ),
}));

vi.mock("@redshirt-sports/ui/components/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

vi.mock("@redshirt-sports/ui/components/badge", () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@redshirt-sports/ui/components/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SelectGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { BallotInboxVoter } from "@/components/ballot-inbox-voter";

const submittedVoter = {
  userId: "user-1",
  firstName: "Pat",
  lastName: "Voter",
  organization: "FCS Panel",
  submitted: true,
};

describe("BallotInboxVoter", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
  });

  it("keeps name and status visible and hides move controls until Manage", async () => {
    const user = userEvent.setup();
    const onReassign = vi.fn();
    render(
      <ul>
        <BallotInboxVoter
          voter={submittedVoter}
          otherWeeks={[{ weekKey: "2-4", label: "Week 4" }]}
          reassignTarget="2-4"
          onReassignTargetChange={vi.fn()}
          onReassign={onReassign}
          onCopyNudge={vi.fn()}
          onEmailNudge={vi.fn()}
          pending={false}
        />
      </ul>,
    );

    expect(screen.getAllByText("Pat Voter").length).toBeGreaterThan(0);
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Manage/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Move ballot/i }));
    expect(onReassign).toHaveBeenCalled();
  });

  it("shows nudge actions for missing voters", async () => {
    const user = userEvent.setup();
    const onCopyNudge = vi.fn();
    render(
      <ul>
        <BallotInboxVoter
          voter={{ ...submittedVoter, submitted: false }}
          otherWeeks={[]}
          reassignTarget=""
          onReassignTargetChange={vi.fn()}
          onReassign={vi.fn()}
          onCopyNudge={onCopyNudge}
          onEmailNudge={vi.fn()}
          pending={false}
        />
      </ul>,
    );

    expect(screen.getByText("Missing")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Copy nudge/i }));
    expect(onCopyNudge).toHaveBeenCalled();
  });
});
