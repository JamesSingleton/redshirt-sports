import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.DATABASE_URL ??= "postgres://localhost:5432/test";

const transactionMock = vi.fn();

vi.mock("../../src/client", () => ({
  primaryDb: {
    transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

describe("submitBallot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts ballot then entries inside one transaction", async () => {
    const ballot = {
      id: "ballot-1",
      pollId: "poll-1",
      userId: "user-1",
      weekId: "week-1",
    };

    let call = 0;
    const entryValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      insert: vi.fn(() => {
        call += 1;
        if (call === 1) {
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([ballot]),
            }),
          };
        }
        return {
          values: entryValues,
        };
      }),
    };

    transactionMock.mockImplementation(async (fn: (tx: typeof tx) => unknown) =>
      fn(tx),
    );

    const { submitBallot } = await import("../../src/queries/voting");

    const entries = [
      { schoolId: "school-a", rank: 1, points: 25 },
      { schoolId: "school-b", rank: 2, points: 24 },
    ];

    const result = await submitBallot({
      pollId: "poll-1",
      userId: "user-1",
      weekId: "week-1",
      entries,
    });

    expect(result).toEqual(ballot);
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(tx.insert).toHaveBeenCalledTimes(2);
    expect(entryValues).toHaveBeenCalledWith([
      {
        ballotId: "ballot-1",
        schoolId: "school-a",
        rank: 1,
        points: 25,
      },
      {
        ballotId: "ballot-1",
        schoolId: "school-b",
        rank: 2,
        points: 24,
      },
    ]);
  });

  it("throws when ballot insert returns nothing", async () => {
    const tx = {
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      })),
    };

    transactionMock.mockImplementation(async (fn: (tx: typeof tx) => unknown) =>
      fn(tx),
    );

    const { submitBallot } = await import("../../src/queries/voting");

    await expect(
      submitBallot({
        pollId: "poll-1",
        userId: "user-1",
        weekId: "week-1",
        entries: [{ schoolId: "school-a", rank: 1, points: 25 }],
      }),
    ).rejects.toThrow("Failed to create ballot");
  });
});
