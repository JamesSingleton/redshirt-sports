import { personHref } from "@/lib/person-href";

describe("personHref", () => {
  it("links a person to their /people profile", () => {
    expect(personHref("jane-author")).toBe("/people/jane-author");
  });
});
