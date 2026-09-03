import {
  FINAL_RANKINGS_SEGMENT,
  formatWeekSegment,
  isWeekCompleteForVoting,
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
  parseWeekSegment,
  weekTitle,
} from "../week-url";

describe("parseWeekSegment", () => {
  it("maps final-rankings to 999", () => {
    expect(parseWeekSegment(FINAL_RANKINGS_SEGMENT)).toBe(
      LEGACY_FINAL_RANKINGS_WEEK,
    );
  });

  it("maps preseason to 0", () => {
    expect(parseWeekSegment("preseason")).toBe(LEGACY_PRESEASON_WEEK);
  });

  it("parses numeric segments", () => {
    expect(parseWeekSegment("0")).toBe(0);
    expect(parseWeekSegment("12")).toBe(12);
  });

  it("rejects invalid segments", () => {
    expect(() => parseWeekSegment("not-a-week")).toThrow(
      "Invalid week segment: not-a-week",
    );
  });
});

describe("formatWeekSegment", () => {
  it("maps 999 to final-rankings", () => {
    expect(formatWeekSegment(LEGACY_FINAL_RANKINGS_WEEK)).toBe(
      FINAL_RANKINGS_SEGMENT,
    );
  });

  it("keeps preseason as numeric 0", () => {
    expect(formatWeekSegment(LEGACY_PRESEASON_WEEK)).toBe("0");
  });

  it("stringifies regular weeks", () => {
    expect(formatWeekSegment(7)).toBe("7");
  });
});

describe("isWeekCompleteForVoting", () => {
  const endDate = new Date("2026-09-08T06:59:00.000Z");

  it("is false more than 48h before endDate", () => {
    expect(
      isWeekCompleteForVoting(endDate, new Date("2026-09-02T12:00:00.000Z")),
    ).toBe(false);
  });

  it("is true at endDate minus 48h", () => {
    expect(
      isWeekCompleteForVoting(endDate, new Date("2026-09-06T06:59:00.000Z")),
    ).toBe(true);
  });
});

describe("weekTitle", () => {
  it("labels preseason, final rankings, and regular weeks", () => {
    expect(weekTitle(LEGACY_PRESEASON_WEEK)).toBe("Preseason");
    expect(weekTitle(LEGACY_FINAL_RANKINGS_WEEK)).toBe("Final Rankings");
    expect(weekTitle(3)).toBe("Week 3");
  });
});
