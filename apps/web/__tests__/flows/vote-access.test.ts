import { userCanVoteOnPoll } from "@/lib/require-poll-voter";

/**
 * Vote page access gating composition:
 * assigned + not voted → show form
 * assigned + voted → confirmation redirect
 * unassigned → home redirect
 *
 * Mirrors the branching in VotePageAuth without mounting the full RSC tree.
 */

const {
  mockGetPollBySportAndSlug,
  mockIsUserAssignedToPoll,
  mockHasVoterVoted,
} = vi.hoisted(() => ({
  mockGetPollBySportAndSlug: vi.fn(),
  mockIsUserAssignedToPoll: vi.fn(),
  mockHasVoterVoted: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getPollBySportAndSlug: mockGetPollBySportAndSlug,
  isUserAssignedToPoll: mockIsUserAssignedToPoll,
  hasVoterVoted: mockHasVoterVoted,
}));

type VoteAccessDecision =
  | { action: "show-form" }
  | { action: "redirect"; to: string };

async function resolveVoteAccess({
  userId,
  sportId,
  pollSlug,
  year,
  week,
}: {
  userId: string;
  sportId: string;
  pollSlug: string;
  year: number;
  week: number;
}): Promise<VoteAccessDecision> {
  const canVote = await userCanVoteOnPoll({ userId, sportId, pollSlug });
  if (!canVote) {
    return { action: "redirect", to: "/" };
  }

  const voted = await mockHasVoterVoted({
    year,
    week,
    division: pollSlug,
    sportId,
    userId,
  });
  if (voted) {
    return {
      action: "redirect",
      to: `/vote/college/football/${pollSlug}/confirmation`,
    };
  }

  return { action: "show-form" };
}

describe("vote page access flow", () => {
  beforeEach(() => {
    mockGetPollBySportAndSlug.mockReset();
    mockIsUserAssignedToPoll.mockReset();
    mockHasVoterVoted.mockReset();
  });

  it("shows form when assigned and has not voted", async () => {
    mockGetPollBySportAndSlug.mockResolvedValue({
      id: "poll-1",
      isActive: true,
    });
    mockIsUserAssignedToPoll.mockResolvedValue(true);
    mockHasVoterVoted.mockResolvedValue(false);

    await expect(
      resolveVoteAccess({
        userId: "user-1",
        sportId: "sport-1",
        pollSlug: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toEqual({ action: "show-form" });
  });

  it("redirects to confirmation when assigned and already voted", async () => {
    mockGetPollBySportAndSlug.mockResolvedValue({
      id: "poll-1",
      isActive: true,
    });
    mockIsUserAssignedToPoll.mockResolvedValue(true);
    mockHasVoterVoted.mockResolvedValue(true);

    await expect(
      resolveVoteAccess({
        userId: "user-1",
        sportId: "sport-1",
        pollSlug: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toEqual({
      action: "redirect",
      to: "/vote/college/football/fbs/confirmation",
    });
  });

  it("redirects home when the poll is inactive", async () => {
    mockGetPollBySportAndSlug.mockResolvedValue({
      id: "poll-1",
      isActive: false,
    });

    await expect(
      resolveVoteAccess({
        userId: "user-1",
        sportId: "sport-1",
        pollSlug: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toEqual({ action: "redirect", to: "/" });
    expect(mockIsUserAssignedToPoll).not.toHaveBeenCalled();
    expect(mockHasVoterVoted).not.toHaveBeenCalled();
  });

  it("redirects home when user is not assigned to the poll", async () => {
    mockGetPollBySportAndSlug.mockResolvedValue({
      id: "poll-1",
      isActive: true,
    });
    mockIsUserAssignedToPoll.mockResolvedValue(false);

    await expect(
      resolveVoteAccess({
        userId: "user-1",
        sportId: "sport-1",
        pollSlug: "fbs",
        year: 2025,
        week: 1,
      }),
    ).resolves.toEqual({ action: "redirect", to: "/" });
    expect(mockHasVoterVoted).not.toHaveBeenCalled();
  });
});
