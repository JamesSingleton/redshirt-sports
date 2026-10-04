import {
  formatAcademicYear,
  formatAcademicYearShort,
  formatHeight,
  formatPortalDate,
  formatWeight,
  isPortalStatus,
  PORTAL_STATUS_OPTIONS,
  playerFullName,
  portalSportLabel,
  schoolDisplayName,
} from "@/lib/transfer-portal-format";

describe("transfer portal formatting", () => {
  it("labels known portal sports", () => {
    expect(portalSportLabel("football")).toBe("Football");
    expect(portalSportLabel("womens-basketball")).toBe("Women's basketball");
    expect(portalSportLabel("hockey")).toBeNull();
  });

  it("lists every status option", () => {
    expect(PORTAL_STATUS_OPTIONS).toEqual([
      "ENTERED",
      "COMMITTED",
      "SIGNED",
      "ENROLLED",
      "WITHDRAWN",
    ]);
  });

  it("recognizes portal statuses", () => {
    expect(isPortalStatus("COMMITTED")).toBe(true);
    expect(isPortalStatus("committed")).toBe(false);
    expect(isPortalStatus(undefined)).toBe(false);
    expect(isPortalStatus(1)).toBe(false);
  });

  it("formats academic years", () => {
    expect(formatAcademicYear(null, false)).toBeNull();
    expect(formatAcademicYear("SO", false)).toBe("Sophomore");
    expect(formatAcademicYear("GR", true)).toBe("Redshirt graduate");
  });

  it("formats short academic years", () => {
    expect(formatAcademicYearShort(null, true)).toBeNull();
    expect(formatAcademicYearShort("FR", false)).toBe("FR");
    expect(formatAcademicYearShort("SR", true)).toBe("RS SR");
  });

  it("formats height and weight", () => {
    expect(formatHeight(null)).toBeNull();
    expect(formatHeight(0)).toBeNull();
    expect(formatHeight(75)).toBe("6-3");
    expect(formatWeight(null)).toBeNull();
    expect(formatWeight(205)).toBe("205 lbs");
  });

  it("formats portal dates in UTC", () => {
    expect(formatPortalDate(null)).toBeNull();
    expect(formatPortalDate("2026-01-05T00:00:00.000Z")).toBe("Jan 5, 2026");
    expect(formatPortalDate(new Date("2025-12-31T23:00:00.000Z"))).toBe(
      "Dec 31, 2025",
    );
  });

  it("builds player and school names", () => {
    expect(playerFullName({ firstName: "Jane", lastName: "Doe" })).toBe(
      "Jane Doe",
    );
    expect(schoolDisplayName(null)).toBeNull();
    expect(schoolDisplayName({ shortName: "MSU", name: "Montana State" })).toBe(
      "MSU",
    );
    expect(schoolDisplayName({ shortName: null, name: "Montana State" })).toBe(
      "Montana State",
    );
    expect(schoolDisplayName({ shortName: null, name: null })).toBeNull();
  });
});
