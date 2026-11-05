import { describe, expect, it } from "vitest";

import { countChangedWords, decideModifiedAt } from "./change-size";

const publishedAt = "2026-11-01T18:00:00.000Z";
const now = new Date("2026-11-03T18:00:00.000Z");
const body =
  "Baylor fired Dave Aranda on Sunday after four seasons. Maryland and NC State are also searching for a new head coach.";

describe("countChangedWords", () => {
  it("counts a one-word typo fix as two changed words", () => {
    expect(
      countChangedWords("Baylor fird Dave Aranda", "Baylor fired Dave Aranda"),
    ).toBe(2);
  });

  it("ignores case, punctuation and word order", () => {
    expect(countChangedWords("Hello, world.", "world hello")).toBe(0);
  });

  it("counts every word in an added sentence", () => {
    expect(
      countChangedWords(
        body,
        `${body} Sam Houston hired a new coach from the SWAC on Tuesday.`,
      ),
    ).toBe(11);
  });
});

describe("decideModifiedAt", () => {
  it("stamps an update that adds a sentence", () => {
    expect(
      decideModifiedAt({
        publishedAt,
        beforeText: body,
        afterText: `${body} Sam Houston hired a new coach from the SWAC on Tuesday.`,
        now,
      }),
    ).toEqual({ update: true, reason: "11 words changed" });
  });

  it("skips a typo fix", () => {
    expect(
      decideModifiedAt({
        publishedAt,
        beforeText: body,
        afterText: body.replace("fired", "fird"),
        now,
      }).update,
    ).toBe(false);
  });

  it("stamps a title change even when the body is untouched", () => {
    expect(
      decideModifiedAt({
        publishedAt,
        titleChanged: true,
        beforeText: body,
        afterText: body,
        now,
      }),
    ).toEqual({ update: true, reason: "title changed" });
  });

  it("skips edits in the first hour after publishing", () => {
    expect(
      decideModifiedAt({
        publishedAt,
        titleChanged: true,
        now: new Date("2026-11-01T18:30:00.000Z"),
      }),
    ).toEqual({ update: false, reason: "within an hour of publishing" });
  });

  it("skips posts that were never published", () => {
    expect(decideModifiedAt({ publishedAt: null, now }).update).toBe(false);
  });
});
