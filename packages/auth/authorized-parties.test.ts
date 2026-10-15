import { describe, expect, it } from "vitest";

import {
  AUTHORIZED_PARTIES,
  resolveAuthorizedParties,
} from "./authorized-parties";

describe("resolveAuthorizedParties", () => {
  it("lists the production subdomains and the three local app ports", () => {
    expect(AUTHORIZED_PARTIES).toEqual([
      "https://www.redshirtsports.com",
      "https://vote.redshirtsports.com",
      "https://admin.redshirtsports.com",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ]);
  });

  it("adds an explicitly configured vote origin", () => {
    const parties = resolveAuthorizedParties({
      NEXT_PUBLIC_VOTE_URL: "http://localhost:3002/",
    });
    expect(parties).toContain("http://localhost:3002");
  });
});
