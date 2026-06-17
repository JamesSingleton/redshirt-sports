import { describe, expect, it } from "vitest";

import { conferenceMatchesDivisionSegment } from "@/lib/conference-division-match";

describe("conferenceMatchesDivisionSegment", () => {
  it("matches D1 conferences by sport subgrouping affiliation", () => {
    expect(
      conferenceMatchesDivisionSegment(
        {
          division: "d1",
          subgroupings: [{ sport: "football", subgrouping: "fbs" }],
        },
        "football",
        "fbs",
      ),
    ).toBe(true);
  });

  it("matches D2 conferences by division slug", () => {
    expect(
      conferenceMatchesDivisionSegment(
        {
          division: "d2",
          subgroupings: [],
        },
        "football",
        "d2",
      ),
    ).toBe(true);
  });

  it("matches D3 conferences by division slug", () => {
    expect(
      conferenceMatchesDivisionSegment(
        {
          division: "d3",
          subgroupings: null,
        },
        "basketball",
        "d3",
      ),
    ).toBe(true);
  });

  it("rejects D2 conference when division segment is D3", () => {
    expect(
      conferenceMatchesDivisionSegment(
        {
          division: "d2",
          subgroupings: [],
        },
        "football",
        "d3",
      ),
    ).toBe(false);
  });

  it("does not match D1 conferences by division slug alone", () => {
    expect(
      conferenceMatchesDivisionSegment(
        {
          division: "d1",
          subgroupings: [],
        },
        "football",
        "d1",
      ),
    ).toBe(false);
  });
});
