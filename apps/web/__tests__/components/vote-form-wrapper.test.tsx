import { render, screen } from "@testing-library/react";

const { mockForm } = vi.hoisted(() => ({ mockForm: vi.fn() }));

vi.mock("@/components/forms/top-25", () => {
  const MockTop25 = (props: Record<string, unknown>) => {
    mockForm(props);
    return <div data-testid="top-25-form" />;
  };
  return { __esModule: true, CreateTop25: MockTop25, EditTop25: MockTop25 };
});

import VoteFormWrapper, {
  EditVoteFormWrapper,
} from "@/components/vote-form-wrapper";

const schools = [{ _id: "school-1", name: "Alabama" }] as never;

describe("VoteFormWrapper", () => {
  beforeEach(() => mockForm.mockReset());

  it("passes last week's ballot to a new ballot", () => {
    const previousBallot = [{ teamId: "school-1", rank: 1 }] as never;
    render(
      <VoteFormWrapper schools={schools} previousBallot={previousBallot} />,
    );
    expect(screen.getByTestId("top-25-form")).toBeInTheDocument();
    expect(mockForm).toHaveBeenCalledWith({ schools, previousBallot });
  });

  it("passes this week's ballot when editing", () => {
    const currentBallot = [{ teamId: "school-1", rank: 1 }];
    render(
      <EditVoteFormWrapper schools={schools} currentBallot={currentBallot} />,
    );
    expect(mockForm).toHaveBeenCalledWith({ schools, currentBallot });
  });
});
