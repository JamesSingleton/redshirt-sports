import { getCollegeSportSection } from "@/lib/sport-section";

describe("getCollegeSportSection", () => {
  it("prefixes the sport title with College", () => {
    expect(getCollegeSportSection({ title: "Football" })).toBe(
      "College Football",
    );
    expect(getCollegeSportSection({ title: "Men's Basketball" })).toBe(
      "College Men's Basketball",
    );
    expect(getCollegeSportSection({ title: "Women's Basketball" })).toBe(
      "College Women's Basketball",
    );
  });

  it("returns titles that already include College unchanged", () => {
    expect(getCollegeSportSection({ title: "College Football" })).toBe(
      "College Football",
    );
  });

  it("returns undefined when sport or title is missing", () => {
    expect(getCollegeSportSection(null)).toBeUndefined();
    expect(getCollegeSportSection(undefined)).toBeUndefined();
    expect(getCollegeSportSection({ title: "" })).toBeUndefined();
    expect(getCollegeSportSection({ title: "   " })).toBeUndefined();
  });
});
