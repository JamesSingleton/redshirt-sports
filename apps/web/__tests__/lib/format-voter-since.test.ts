import { describe, expect, it } from "vitest";

import { formatVoterSince } from "@/lib/format-voter-since";

describe("formatVoterSince", () => {
  it("returns em dash when date is missing", () => {
    expect(formatVoterSince(null)).toBe("—");
    expect(formatVoterSince(undefined)).toBe("—");
  });

  it("returns the calendar year of the first ballot", () => {
    expect(formatVoterSince(new Date("2024-09-15T12:00:00Z"))).toBe("2024");
  });
});
