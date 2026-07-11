import { formatPublishDate } from "@/lib/format-publish-date";

const now = new Date("2026-06-24T20:00:00.000Z");

describe("formatPublishDate", () => {
  it("shows compact minutes for posts under an hour old", () => {
    expect(formatPublishDate("2026-06-24T19:15:00.000Z", now)).toBe("45m");
  });

  it("shows compact hours for posts under a day old", () => {
    expect(formatPublishDate("2026-06-24T17:00:00.000Z", now)).toBe("3h");
    expect(formatPublishDate("2026-06-24T12:00:00.000Z", now)).toBe("8h");
  });

  it("shows days ago for posts between 1 and 4 days old", () => {
    expect(formatPublishDate("2026-06-23T20:00:00.000Z", now)).toBe(
      "1 day ago",
    );
    expect(formatPublishDate("2026-06-22T20:00:00.000Z", now)).toBe(
      "2 days ago",
    );
    expect(formatPublishDate("2026-06-20T20:00:00.000Z", now)).toBe(
      "4 days ago",
    );
  });

  it("shows the publish date once the post is 5 or more days old", () => {
    expect(formatPublishDate("2026-06-19T20:00:00.000Z", now)).toBe(
      "Jun 19, 2026",
    );
    expect(formatPublishDate("2026-06-01T20:00:00.000Z", now)).toBe(
      "Jun 1, 2026",
    );
  });
});
