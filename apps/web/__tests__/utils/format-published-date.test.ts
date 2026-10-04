import { formatPublishedDate } from "@/utils/format-published-date";

const published = new Date("2026-10-04T15:00:00.000Z");
const at = (ms: number) => published.getTime() + ms;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe("formatPublishedDate", () => {
  it.each([
    [0, "Just now"],
    [59_999, "Just now"],
    [-30_000, "Just now"],
    [MINUTE, "1 min ago"],
    [59 * MINUTE, "59 min ago"],
    [HOUR, "1 hr ago"],
    [2 * HOUR + 30 * MINUTE, "2 hrs ago"],
    [24 * HOUR - 1, "23 hrs ago"],
    [24 * HOUR, "Oct 4, 2026"],
    [30 * 24 * HOUR, "Oct 4, 2026"],
  ])("%i ms after publishing reads %s", (elapsed, expected) => {
    expect(formatPublishedDate(published, at(elapsed))).toBe(expected);
  });

  it("formats the date in the Phoenix timezone", () => {
    const lateUtc = new Date("2026-10-05T03:00:00.000Z");
    expect(formatPublishedDate(lateUtc, at(30 * 24 * HOUR))).toBe(
      "Oct 4, 2026",
    );
  });
});
