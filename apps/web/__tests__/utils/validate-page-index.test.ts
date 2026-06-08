import { validatePageIndex } from "@/utils/validate-page-index";

describe("validatePageIndex", () => {
  it("returns 1 when page is undefined", () => {
    expect(validatePageIndex(undefined)).toBe(1);
  });

  it("returns 1 when page is an empty string", () => {
    expect(validatePageIndex("")).toBe(1);
  });

  it("parses a valid numeric string", () => {
    expect(validatePageIndex("3")).toBe(3);
  });

  it("uses the first value when page is an array", () => {
    expect(validatePageIndex(["5", "9"])).toBe(5);
  });

  it("returns 1 when the first array value is missing", () => {
    expect(validatePageIndex([undefined as unknown as string])).toBe(1);
  });

  it("returns 1 for non-numeric values", () => {
    expect(validatePageIndex("abc")).toBe(1);
  });

  it("returns 1 for zero or negative numbers", () => {
    expect(validatePageIndex("0")).toBe(1);
    expect(validatePageIndex("-2")).toBe(1);
  });
});
