import {
  digestIssueKey,
  digestWeekLabel,
  digestWindow,
} from "@/lib/newsletter/digest";

describe("weekly digest dates", () => {
  const sundayMorning = new Date("2026-11-22T13:00:00.000Z"); // 8 AM Eastern

  it("covers the seven days before the run", () => {
    expect(digestWindow(sundayMorning)).toEqual({
      from: "2026-11-15T13:00:00.000Z",
      to: "2026-11-22T13:00:00.000Z",
    });
  });

  it("keys an issue by the Eastern calendar day", () => {
    expect(digestIssueKey(sundayMorning)).toBe("newsletter:weekly:2026-11-22");
    // 11:30 PM Eastern Saturday is still Saturday's issue.
    expect(digestIssueKey(new Date("2026-11-22T04:30:00.000Z"))).toBe(
      "newsletter:weekly:2026-11-21",
    );
  });

  it("labels the week by its first day", () => {
    expect(digestWeekLabel("2026-11-15T13:00:00.000Z")).toBe("Nov 15");
  });
});
