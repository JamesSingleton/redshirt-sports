import { describe, expect, it } from "vitest";

import {
  createConferenceMatcher,
  normalizeConferenceLabel,
} from "./conference-matching";

const conferences = [
  {
    id: "caa",
    name: "Coastal Athletic Association",
    shortName: "CAA",
    abbreviation: "CAA",
  },
  {
    id: "mvfc",
    name: "Missouri Valley Football Conference",
    shortName: "MVFC",
    abbreviation: "MVFC",
  },
  {
    id: "mvc",
    name: "Missouri Valley Conference",
    shortName: "Missouri Valley",
    abbreviation: "MVC",
  },
  {
    id: "socon",
    name: "Southern Conference",
    shortName: "SoCon",
    abbreviation: "SoCon",
  },
  {
    id: "ivy",
    name: "Ivy League",
    shortName: "Ivy League",
    abbreviation: "Ivy League",
  },
  {
    id: "ovc",
    name: "Ohio Valley Conference",
    shortName: "Ohio Valley",
    abbreviation: "OVC",
  },
  {
    id: "big-south",
    name: "Big South Conference",
    shortName: "Big South",
    abbreviation: "Big South",
  },
  {
    id: "ovc-big-south",
    name: "Big South - OVC Football Association",
    shortName: "OVC-Big South",
    abbreviation: "OVC-Big South",
  },
  {
    id: "fcs-ind",
    name: "FCS Independents",
    shortName: "FCS Independents",
    abbreviation: "FCS Independents",
  },
  {
    id: "wac",
    name: "Western Athletic Conference",
    shortName: "WAC",
    abbreviation: "WAC",
  },
  {
    id: "asun",
    name: "Atlantic Sun Conference",
    shortName: "ASUN",
    abbreviation: "ASUN",
  },
  {
    id: "mid-american",
    name: "Mid-American Conference",
    shortName: "MAC",
    abbreviation: "MAC",
  },
  {
    id: "middle-atlantic",
    name: "Middle Atlantic Conference",
    shortName: "MAC",
    abbreviation: null,
  },
];

const match = createConferenceMatcher(conferences);

describe("normalizeConferenceLabel", () => {
  it("ignores case, punctuation, and spacing", () => {
    expect(normalizeConferenceLabel("  OVC-Big   South ")).toBe(
      "ovc big south",
    );
    expect(normalizeConferenceLabel("FCS Indep.")).toBe("fcs indep");
  });
});

describe("createConferenceMatcher", () => {
  it("links a season's conference after the school has left it", () => {
    // Delaware played in the CAA in 2023 but is in CUSA today.
    expect(
      match("CAA", {
        seasonYear: 2023,
        currentConferenceIds: new Set(["cusa"]),
      }),
    ).toBe("caa");
    expect(
      match("MVFC", {
        seasonYear: 2024,
        currentConferenceIds: new Set(["mountain-west"]),
      }),
    ).toBe("mvfc");
  });

  it("matches full names and abbreviations regardless of case", () => {
    expect(match("coastal athletic association", { seasonYear: 2024 })).toBe(
      "caa",
    );
    expect(match(" mvfc ", { seasonYear: 2024 })).toBe("mvfc");
  });

  it("resolves ESPN short names through aliases", () => {
    expect(match("Southern", { seasonYear: 2024 })).toBe("socon");
    expect(match("Ivy", { seasonYear: 2024 })).toBe("ivy");
    expect(match("FCS Indep.", { seasonYear: 2025 })).toBe("fcs-ind");
  });

  it("reads OVC and Big South by season around the 2023 merger", () => {
    expect(match("OVC", { seasonYear: 2022 })).toBe("ovc");
    expect(match("OVC", { seasonYear: 2023 })).toBe("ovc-big-south");
    expect(match("Big South", { seasonYear: 2022 })).toBe("big-south");
    expect(match("Big South", { seasonYear: 2024 })).toBe("ovc-big-south");
  });

  it("links WAC and ASUN, which sponsored FCS football through 2022", () => {
    expect(match("WAC", { seasonYear: 2022 })).toBe("wac");
    expect(match("ASUN", { seasonYear: 2022 })).toBe("asun");
  });

  it("breaks ties with conferences that play the sport, then the school's own", () => {
    expect(match("MAC", { seasonYear: 2024 })).toBeNull();
    expect(
      match("MAC", {
        seasonYear: 2024,
        sportConferenceIds: new Set(["mid-american", "middle-atlantic"]),
        currentConferenceIds: new Set(["middle-atlantic"]),
      }),
    ).toBe("middle-atlantic");
    expect(
      match("MAC", {
        seasonYear: 2024,
        sportConferenceIds: new Set(["mid-american"]),
      }),
    ).toBe("mid-american");
  });

  it("leaves unknown labels and aliases with no target unmatched", () => {
    expect(match("Nope Conference", { seasonYear: 2024 })).toBeNull();
    expect(match(null, { seasonYear: 2024 })).toBeNull();
    const withoutAssociation = createConferenceMatcher(
      conferences.filter((conference) => conference.id !== "ovc-big-south"),
    );
    // Not the Ohio Valley Conference: "OVC" meant the association in 2023.
    expect(withoutAssociation("OVC", { seasonYear: 2023 })).toBeNull();
  });
});
