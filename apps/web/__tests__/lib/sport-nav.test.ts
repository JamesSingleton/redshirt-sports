import { describe, expect, it } from "vitest";

import {
  navPollLabel,
  pollNavLabel,
  sportHubPath,
  sportNavLabel,
  sportRankingsIndexPath,
} from "@/lib/sport-nav";

describe("sport nav helpers", () => {
  it("formats sport labels and paths", () => {
    expect(sportNavLabel("football", "Football")).toBe("College Football");
    expect(sportNavLabel("lacrosse", "Lacrosse")).toBe("Lacrosse");
    expect(sportHubPath("football")).toBe("/college/football/news");
    expect(sportRankingsIndexPath("mens-basketball")).toBe(
      "/college/mens-basketball/rankings",
    );
  });

  it("labels polls with standard short names", () => {
    expect(pollNavLabel("fcs")).toBe("FCS");
    expect(pollNavLabel("mid-major")).toBe("Mid-Major");
    expect(pollNavLabel("power-conferences")).toBe("Power Conferences");
    expect(pollNavLabel("juco")).toBe("JUCO");
  });

  it("prefers the editor's poll label when it has text", () => {
    expect(navPollLabel({ slug: "fbs", label: "Bowl Subdivision" })).toBe(
      "Bowl Subdivision",
    );
    expect(navPollLabel({ slug: "fbs", label: "   " })).toBe("FBS");
    expect(navPollLabel({ slug: "fbs", label: null })).toBe("FBS");
  });
});
