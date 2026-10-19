import { describe, expect, it } from "vitest";

import { redirectsToRepoint } from "../chain";

describe("redirectsToRepoint", () => {
  it("repoints redirects that land on the old path", () => {
    expect(
      redirectsToRepoint(
        [{ _id: "c", source: "/old-article" }],
        "/authors/old",
        "/authors/new",
      ),
    ).toEqual([{ _id: "c", source: "/old-article" }]);
  });

  it("skips a row that would point the new path at itself", () => {
    expect(
      redirectsToRepoint(
        [{ _id: "loop", source: "/authors/new" }],
        "/authors/old",
        "/authors/new",
      ),
    ).toEqual([]);
  });

  it("skips the redirect being created", () => {
    expect(
      redirectsToRepoint(
        [{ _id: "self", source: "/authors/old" }],
        "/authors/old",
        "/authors/new",
      ),
    ).toEqual([]);
  });
});
