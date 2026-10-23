import { describe, expect, it } from "vitest";

import {
  resolveVoterHighlightUserIds,
  voterBallotSlug,
} from "@/lib/voter-ballot-slug";

describe("voterBallotSlug", () => {
  it("slugifies voter names", () => {
    expect(voterBallotSlug("Jane Doe")).toBe("jane-doe");
  });
});

describe("resolveVoterHighlightUserIds", () => {
  const voters = [
    { userId: "u1", slug: "jane-doe" },
    { userId: "u2", slug: "john-smith" },
  ];

  it("returns empty for no tokens", () => {
    expect(resolveVoterHighlightUserIds([], voters)).toEqual([]);
  });

  it("resolves slugs and raw user ids", () => {
    expect(
      resolveVoterHighlightUserIds(["jane-doe", "u2", "unknown"], voters),
    ).toEqual(["u1", "u2"]);
  });
});
