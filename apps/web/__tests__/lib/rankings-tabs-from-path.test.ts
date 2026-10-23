import { describe, expect, it } from "vitest";

import { buildRankingsTabsForPathname } from "@/lib/rankings-tabs-from-path";

describe("buildRankingsTabsForPathname", () => {
  it("uses week from pathname for poll and ballots hrefs", () => {
    const tabs = buildRankingsTabsForPathname(
      "/college/football/rankings/fcs/2026/7/ballots",
      "football",
      "fcs",
      { year: "2025", weekSegment: "final-rankings" },
    );
    expect(tabs.find((t) => t.id === "poll")?.href).toBe(
      "/college/football/rankings/fcs/2026/7",
    );
    expect(tabs.find((t) => t.id === "ballots")?.href).toBe(
      "/college/football/rankings/fcs/2026/7/ballots",
    );
  });

  it("uses fallback when pathname division does not match", () => {
    const tabs = buildRankingsTabsForPathname(
      "/college/football/rankings/fcs/2026/7/ballots",
      "football",
      "fbs",
      { year: "2025", weekSegment: "final-rankings" },
    );
    expect(tabs.find((t) => t.id === "poll")?.href).toBe(
      "/college/football/rankings/fbs/2025/final-rankings",
    );
  });

  it("falls back to latest week on division-only routes", () => {
    const tabs = buildRankingsTabsForPathname(
      "/college/football/rankings/fcs/voters",
      "football",
      "fcs",
      { year: "2026", weekSegment: "7" },
    );
    expect(tabs.find((t) => t.id === "poll")?.href).toBe(
      "/college/football/rankings/fcs/2026/7",
    );
  });
});
