import { describe, expect, it } from "vitest";

import {
  buildRankingsTabs,
  rankingsMethodologyHref,
  rankingsTabHrefForActive,
  rankingsWeekPath,
} from "@/lib/rankings-nav";

describe("rankings nav helpers", () => {
  it("builds week and methodology hrefs", () => {
    expect(rankingsMethodologyHref()).toBe("/rankings/methodology");
    expect(rankingsWeekPath("football", "fbs", "2026", "7")).toBe(
      "/college/football/rankings/fbs/2026/7",
    );
  });

  it("builds tabs for a poll week", () => {
    const tabs = buildRankingsTabs({
      sport: "football",
      division: "fbs",
      year: "2026",
      weekSegment: "7",
    });
    expect(tabs.map((t) => t.id)).toEqual([
      "poll",
      "ballots",
      "voters",
      "history",
      "methodology",
    ]);
    expect(tabs[1]?.href).toBe("/college/football/rankings/fbs/2026/7/ballots");
    expect(tabs.find((tab) => tab.id === "methodology")?.href).toBe(
      "/rankings/methodology",
    );
  });

  it("resolves href for active tab with fallback", () => {
    const tabs = buildRankingsTabs({
      sport: "football",
      division: "fbs",
      year: "2026",
      weekSegment: "7",
    });
    expect(rankingsTabHrefForActive(tabs, "voters")).toBe(
      "/college/football/rankings/fbs/voters",
    );
    expect(rankingsTabHrefForActive([], "poll")).toBe("/");
  });
});
