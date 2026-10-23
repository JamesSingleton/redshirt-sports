import { describe, expect, it } from "vitest";

import { formatPollPoints } from "@/lib/format-poll-points";

describe("formatPollPoints", () => {
  it("uses singular pt for 1", () => {
    expect(formatPollPoints(1)).toBe("1 pt");
  });

  it("uses plural pts otherwise", () => {
    expect(formatPollPoints(0)).toBe("0 pts");
    expect(formatPollPoints(512)).toBe("512 pts");
  });
});
