import { describe, expect, it } from "vitest";

import { hasRole } from "./roles";

describe("hasRole", () => {
  it("treats isAdmin as the admin role", () => {
    expect(hasRole({ isAdmin: true }, "admin")).toBe(true);
    expect(hasRole({ isAdmin: false }, "admin")).toBe(false);
    expect(hasRole(undefined, "admin")).toBe(false);
  });

  it("treats isVoter as the voter role", () => {
    expect(hasRole({ isVoter: true }, "voter")).toBe(true);
    expect(hasRole({ isAdmin: true }, "voter")).toBe(false);
  });
});
