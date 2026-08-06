import {
  getPollBySportAndSlug,
  isUserAssignedToPoll,
} from "@redshirt-sports/db/queries";
import type { Mock } from "vitest";

import { userCanVoteOnPoll } from "@/lib/require-poll-voter";

vi.mock("@redshirt-sports/db/queries", () => ({
  getPollBySportAndSlug: vi.fn(),
  isUserAssignedToPoll: vi.fn(),
}));

const mockGetPoll = getPollBySportAndSlug as Mock;
const mockIsAssigned = isUserAssignedToPoll as Mock;

describe("userCanVoteOnPoll", () => {
  beforeEach(() => {
    mockGetPoll.mockReset();
    mockIsAssigned.mockReset();
  });

  it("returns false when the poll does not exist", async () => {
    mockGetPoll.mockResolvedValue(null);

    await expect(
      userCanVoteOnPoll({
        userId: "user-1",
        sportId: "sport-1",
        pollSlug: "fbs",
      }),
    ).resolves.toBe(false);
    expect(mockIsAssigned).not.toHaveBeenCalled();
  });

  it("returns true when the user is assigned to the poll", async () => {
    mockGetPoll.mockResolvedValue({ id: "poll-1" });
    mockIsAssigned.mockResolvedValue(true);

    await expect(
      userCanVoteOnPoll({
        userId: "user-1",
        sportId: "sport-1",
        pollSlug: "fbs",
      }),
    ).resolves.toBe(true);
    expect(mockIsAssigned).toHaveBeenCalledWith({
      pollId: "poll-1",
      userId: "user-1",
    });
  });

  it("returns false when the user is not assigned", async () => {
    mockGetPoll.mockResolvedValue({ id: "poll-1" });
    mockIsAssigned.mockResolvedValue(false);

    await expect(
      userCanVoteOnPoll({
        userId: "user-1",
        sportId: "sport-1",
        pollSlug: "fcs",
      }),
    ).resolves.toBe(false);
  });
});
