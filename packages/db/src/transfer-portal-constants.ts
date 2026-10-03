/** Dependency-free so client components can import the enum values. */

export const PORTAL_STATUSES = [
  "ENTERED",
  "COMMITTED",
  "SIGNED",
  "ENROLLED",
  "WITHDRAWN",
] as const;

export const ACADEMIC_YEARS = ["FR", "SO", "JR", "SR", "GR"] as const;

export type PortalStatus = (typeof PORTAL_STATUSES)[number];
export type AcademicYear = (typeof ACADEMIC_YEARS)[number];
