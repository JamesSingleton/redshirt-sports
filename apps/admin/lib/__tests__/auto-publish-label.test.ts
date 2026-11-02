import {
  describeAutoPublish,
  formatAutoPublishTime,
} from "@/lib/auto-publish-label";

const runAt = new Date("2026-11-09T15:00:00Z");

describe("auto-publish label", () => {
  it("formats the run in Central time", () => {
    expect(formatAutoPublishTime(runAt)).toBe("Mon, Nov 9, 9:00 AM CST");
    expect(formatAutoPublishTime(new Date("2026-09-07T14:00:00Z"))).toBe(
      "Mon, Sep 7, 9:00 AM CDT",
    );
  });

  it.each([
    [
      "scheduled",
      "Auto-publishes Week 10 · Mon, Nov 9, 9:00 AM CST",
      "scheduled",
    ],
    [
      "no-ballots",
      "No ballots in for Week 10 yet · Mon, Nov 9, 9:00 AM CST will skip it unless some come in",
      "warning",
    ],
    ["published", "Week 10 already published", "muted"],
    ["manual", "Week 10 publishes manually", "muted"],
    ["no-week", "No voting week synced for Mon, Nov 9, 9:00 AM CST", "muted"],
    ["off", "Auto-publish off · publish manually", "muted"],
  ] as const)("describes %s", (status, text, tone) => {
    expect(
      describeAutoPublish({ runAt, weekLabel: "Week 10", status }),
    ).toEqual({ text, tone });
  });

  it("falls back when the week is unknown", () => {
    expect(
      describeAutoPublish({ runAt, weekLabel: null, status: "published" }).text,
    ).toBe("This week already published");
  });
});
