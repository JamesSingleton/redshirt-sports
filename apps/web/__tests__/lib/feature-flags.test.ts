const { server } = vi.hoisted(() => ({
  server: {
    analytics: undefined as
      | { evaluateFlags: ReturnType<typeof vi.fn> }
      | undefined,
  },
}));

vi.mock("@redshirt-sports/analytics/server", () => ({
  get analytics() {
    return server.analytics;
  },
}));

import { FLAGS, isFlagEnabled } from "@redshirt-sports/analytics/flags";

function posthogWith(evaluateFlags: ReturnType<typeof vi.fn>) {
  server.analytics = { evaluateFlags };
}

describe("isFlagEnabled", () => {
  beforeEach(() => {
    server.analytics = undefined;
  });

  it("returns the fallback when PostHog isn't configured", async () => {
    await expect(
      isFlagEnabled(FLAGS.top25BallotEditor, "user-1", false),
    ).resolves.toBe(false);
    await expect(
      isFlagEnabled(FLAGS.top25BallotEditor, "user-1", true),
    ).resolves.toBe(true);
  });

  it("returns PostHog's answer for the voter", async () => {
    const isEnabled = vi.fn().mockReturnValue(true);
    const evaluateFlags = vi.fn().mockResolvedValue({ isEnabled });
    posthogWith(evaluateFlags);

    await expect(
      isFlagEnabled(FLAGS.top25BallotEditor, "user-1", false),
    ).resolves.toBe(true);
    expect(evaluateFlags).toHaveBeenCalledWith("user-1", {
      flagKeys: ["top25-ballot-editor"],
    });
    expect(isEnabled).toHaveBeenCalledWith("top25-ballot-editor", {
      defaultValue: false,
    });
  });

  it("returns the fallback when PostHog fails", async () => {
    posthogWith(vi.fn().mockRejectedValue(new Error("timeout")));
    await expect(
      isFlagEnabled(FLAGS.top25BallotEditor, "user-1", false),
    ).resolves.toBe(false);
  });
});
