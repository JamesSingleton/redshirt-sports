import { personHref } from "@/lib/person-href";

describe("legacy /authors URLs", () => {
  it("map to /people profiles via next.config redirect", () => {
    expect(personHref("jane-author")).toBe("/people/jane-author");
  });
});
