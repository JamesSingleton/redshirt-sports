import type { PollWeekNumberOne } from "@/lib/poll-history-data";
import { shortPollWeekLabel } from "@/lib/rankings-history-week-label";

function week(weekLabel: string, week = 1): PollWeekNumberOne {
  return {
    week,
    weekSegment: "regular",
    weekLabel,
    teamId: "t1",
    teamName: "Team",
    teamShortName: "TM",
    points: 25,
    pollHref: "/poll",
  };
}

describe("shortPollWeekLabel", () => {
  it("shortens preseason and final labels", () => {
    expect(shortPollWeekLabel(week("Preseason"), 0)).toBe("Pre");
    expect(shortPollWeekLabel(week("Final Rankings"), 15)).toBe("Fin");
  });

  it("uses week number from label when present", () => {
    expect(shortPollWeekLabel(week("Week 7"), 6)).toBe("W7");
  });

  it("keeps short labels and falls back to index for long unknown labels", () => {
    expect(shortPollWeekLabel(week("Bowls"), 2)).toBe("Bowls");
    expect(shortPollWeekLabel(week("Conference Championship Week"), 4)).toBe(
      "W4",
    );
  });
});
