import { describe, expect, it } from "vitest";

import { rankingsTabActiveFromPath } from "@/lib/rankings-tab-active";

describe("rankingsTabActiveFromPath", () => {
  it("detects active tab from pathname", () => {
    expect(
      rankingsTabActiveFromPath(
        "/college/football/rankings/fbs/2026/7/methodology",
      ),
    ).toBe("methodology");
    expect(
      rankingsTabActiveFromPath("/college/football/rankings/fbs/history"),
    ).toBe("history");
    expect(
      rankingsTabActiveFromPath("/college/football/rankings/fbs/voters"),
    ).toBe("voters");
    expect(
      rankingsTabActiveFromPath(
        "/college/football/rankings/fbs/2026/7/ballots",
      ),
    ).toBe("ballots");
    expect(
      rankingsTabActiveFromPath("/college/football/rankings/fbs/2026/7"),
    ).toBe("poll");
  });
});
