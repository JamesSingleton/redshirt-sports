import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const { mockCapture, mockPopulate } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
  mockPopulate: vi.fn(),
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

vi.mock("@/components/forms/top-25", () => {
  const React = require("react") as typeof import("react");
  return {
    __esModule: true,
    default: React.forwardRef(function MockTop25(
      _props: unknown,
      ref: React.Ref<{ populateWithPreviousBallot: () => void }>,
    ) {
      React.useImperativeHandle(ref, () => ({
        populateWithPreviousBallot: mockPopulate,
      }));
      return <div data-testid="top-25-form" />;
    }),
  };
});

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

vi.mock("@redshirt-sports/ui/components/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@redshirt-sports/ui/components/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import VoteFormWrapper from "@/components/vote-form-wrapper";

const schools = [
  {
    _id: "school-1",
    name: "Alabama",
    shortName: "Alabama",
    abbreviation: "ALA",
    nickname: "Crimson Tide",
    image: null,
  },
] as never;

const previousBallot = [
  {
    id: "1",
    userId: "user-1",
    division: "fbs",
    week: 1,
    year: 2025,
    createdAt: new Date(),
    teamId: "school-1",
    rank: 1,
    points: 25,
    schoolName: "Alabama",
    schoolShortName: "Alabama",
    schoolAbbreviation: "ALA",
    schoolNickname: "Crimson Tide",
    schoolImageUrl: "",
  },
];

describe("VoteFormWrapper", () => {
  beforeEach(() => {
    mockCapture.mockReset();
    mockPopulate.mockReset();
  });

  it("hides Use Previous Ballot when previousBallot is empty", () => {
    render(<VoteFormWrapper schools={schools} previousBallot={[]} />);
    expect(
      screen.queryByRole("button", { name: /Use Previous Ballot/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("top-25-form")).toBeInTheDocument();
  });

  it("shows previous ballot and populates form on click", async () => {
    const user = userEvent.setup();
    render(
      <VoteFormWrapper schools={schools} previousBallot={previousBallot} />,
    );

    expect(screen.getByText("Previous Ballot")).toBeInTheDocument();
    expect(screen.getByText("Alabama")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Use Previous Ballot/i }),
    );

    expect(mockPopulate).toHaveBeenCalled();
    expect(mockCapture).toHaveBeenCalledWith(
      "previous_ballot_populated",
      expect.objectContaining({ previous_ballot_count: 1 }),
    );
  });
});
