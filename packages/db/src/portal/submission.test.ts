import { describe, expect, it } from "vitest";

import { submissionPayloadSchema, submitterSchema } from "./submission";

const base = {
  playerFirstName: " Test ",
  playerLastName: "Player",
  sportSlug: "football",
  currentSchool: "Montana",
  move: "entered",
};
const issues = (input: unknown) =>
  Object.fromEntries(
    (submissionPayloadSchema.safeParse(input).error?.issues ?? []).map(
      (issue) => [issue.path[0], issue.message],
    ),
  );

describe("submission payload", () => {
  it("trims, versions, and drops blank optional fields", () => {
    expect(
      submissionPayloadSchema.parse({
        ...base,
        position: "",
        happenedOn: "",
        link: "",
        note: "  ",
      }),
    ).toEqual({
      v: 1,
      playerFirstName: "Test",
      playerLastName: "Player",
      sportSlug: "football",
      currentSchool: "Montana",
      move: "entered",
    });
  });

  it("requires the basics, with a message per field", () => {
    expect(issues({})).toMatchObject({
      sportSlug: "Pick a sport.",
      move: "Pick what happened.",
    });
    expect(
      issues({ ...base, playerFirstName: " ", currentSchool: "" }),
    ).toEqual({
      playerFirstName: "The player's first name is required.",
      currentSchool: "The player's current school is required.",
    });
    expect(issues({ ...base, sportSlug: "lacrosse" })).toEqual({
      sportSlug: "Pick a sport.",
    });
  });

  it("needs a school for a commitment and a note for 'other'", () => {
    expect(issues({ ...base, move: "committed" })).toEqual({
      destinationSchool: "Which school did they commit to?",
    });
    expect(issues({ ...base, move: "other" })).toEqual({
      note: "Tell us what happened.",
    });
    expect(
      submissionPayloadSchema.parse({
        ...base,
        move: "committed",
        destinationSchool: "Boise State",
      }).destinationSchool,
    ).toBe("Boise State");
  });

  it("checks the date and the link", () => {
    expect(issues({ ...base, happenedOn: "01/15/2026" })).toEqual({
      happenedOn: "Use a date like 2026-01-15.",
    });
    expect(issues({ ...base, happenedOn: "2026-13-45" })).toEqual({
      happenedOn: "Not a real date.",
    });
    expect(issues({ ...base, happenedOn: "2026-02-31" })).toEqual({
      happenedOn: "Not a real date.",
    });
    expect(issues({ ...base, happenedOn: "2999-01-01" })).toEqual({
      happenedOn: "That date is in the future.",
    });
    expect(issues({ ...base, link: "javascript:alert(1)" })).toEqual({
      link: "The link must start with https://",
    });
    expect(issues({ ...base, link: "http://example.test" })).toEqual({
      link: "The link must start with https://",
    });
    expect(
      submissionPayloadSchema.parse({
        ...base,
        happenedOn: "2026-01-15",
        link: "https://example.test/post",
      }),
    ).toMatchObject({
      happenedOn: "2026-01-15",
      link: "https://example.test/post",
    });
  });

  it("caps lengths", () => {
    expect(issues({ ...base, note: "x".repeat(1001) })).toHaveProperty("note");
    expect(issues({ ...base, playerLastName: "x".repeat(81) })).toHaveProperty(
      "playerLastName",
    );
  });
});

describe("submitter", () => {
  it("normalizes the email and requires a role and name", () => {
    expect(
      submitterSchema.parse({
        submitterRole: "coach",
        submitterName: " Test Coach ",
        submitterEmail: " Coach@Example.TEST ",
      }),
    ).toEqual({
      submitterRole: "coach",
      submitterName: "Test Coach",
      submitterEmail: "coach@example.test",
    });
    const result = submitterSchema.safeParse({
      submitterRole: "mascot",
      submitterName: "",
      submitterEmail: "not-an-email",
    });
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Tell us who you are.",
      "Your name is required.",
      "Enter a valid email address.",
    ]);
  });
});
