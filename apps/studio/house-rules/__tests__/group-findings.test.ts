import { describe, expect, it } from "vitest";

import { error, groupFindings, warning } from "../types";

describe("groupFindings", () => {
  it("collapses repeats and puts errors first", () => {
    const grouped = groupFindings([
      warning("style.pac-12", "Use Pac-12", "a"),
      warning("style.pac-12", "Use Pac-12", "b"),
      warning("style.big-ten", "Use Big Ten", "c"),
      error("link.legacy", "Old link", "d"),
      warning("style.pac-12", "Use Pac-12", "e"),
    ]);
    expect(grouped.map((f) => [f.rule, f.count])).toEqual([
      ["link.legacy", 1],
      ["style.pac-12", 3],
      ["style.big-ten", 1],
    ]);
  });

  it("keeps findings with different messages apart", () => {
    expect(
      groupFindings([
        error("link.legacy", '"A" uses the old link format'),
        error("link.legacy", '"B" uses the old link format'),
      ]),
    ).toHaveLength(2);
  });
});
