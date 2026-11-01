import { describe, expect, it } from "vitest";

import {
  ALL_POLL_OPTIONS,
  pollOptionsForSport,
  pollTitle,
  validateSportPoll,
} from "../sport-polls";

describe("pollOptionsForSport", () => {
  it("offers only football polls for football", () => {
    expect(pollOptionsForSport("football").map((o) => o.value)).toEqual([
      "fbs",
      "fcs",
      "d2",
      "d3",
    ]);
  });

  it("offers only basketball polls for basketball", () => {
    for (const sport of ["mens-basketball", "womens-basketball"]) {
      expect(pollOptionsForSport(sport).map((o) => o.value)).toEqual([
        "mid-major",
        "power-conferences",
      ]);
    }
  });

  it("offers nothing for a sport without polls or without a slug", () => {
    expect(pollOptionsForSport("lacrosse")).toEqual([]);
    expect(pollOptionsForSport(undefined)).toEqual([]);
  });

  it("keeps the full list available for typegen", () => {
    expect(ALL_POLL_OPTIONS).toHaveLength(6);
  });
});

describe("validateSportPoll", () => {
  it("accepts a poll that belongs to the sport", () => {
    expect(validateSportPoll("fcs", "football")).toBe(true);
    expect(validateSportPoll("mid-major", "mens-basketball")).toBe(true);
  });

  it("rejects a basketball poll on football", () => {
    expect(validateSportPoll("mid-major", "football")).toBe(
      "Mid-Major isn't a poll for this sport",
    );
  });

  it("asks for the sport slug first", () => {
    expect(validateSportPoll("fbs", undefined)).toBe(
      "Set the sport's slug before adding polls",
    );
  });

  it("leaves empty values to the required rule", () => {
    expect(validateSportPoll(undefined, "football")).toBe(true);
  });
});

describe("pollTitle", () => {
  it("maps known slugs and passes through unknown ones", () => {
    expect(pollTitle("d2")).toBe("Division II");
    expect(pollTitle("naia")).toBe("naia");
    expect(pollTitle(undefined)).toBeUndefined();
  });
});
