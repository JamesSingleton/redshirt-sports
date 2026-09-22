import { describe, expect, it } from "vitest";

import { safeCompare } from "@/lib/safe-compare";

describe("safeCompare", () => {
  it("returns true for equal strings", () => {
    expect(safeCompare("secret", "secret")).toBe(true);
  });

  it("returns false for unequal strings of same length", () => {
    expect(safeCompare("secret", "secreT")).toBe(false);
  });

  it("returns false for unequal lengths without throwing", () => {
    expect(safeCompare("short", "much-longer")).toBe(false);
  });

  it("returns false for non-string inputs without throwing", () => {
    expect(safeCompare(undefined as unknown as string, "secret")).toBe(false);
    expect(safeCompare("secret", undefined as unknown as string)).toBe(false);
  });
});
