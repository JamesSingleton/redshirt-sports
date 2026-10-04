import type {
  AcademicYear,
  PortalStatus,
} from "@redshirt-sports/db/transfer-portal-constants";

export const PORTAL_SPORTS = [
  { slug: "football", label: "Football" },
  { slug: "mens-basketball", label: "Men's basketball" },
  { slug: "womens-basketball", label: "Women's basketball" },
] as const;

export type PortalSportSlug = (typeof PORTAL_SPORTS)[number]["slug"];

export function portalSportLabel(slug: string) {
  return PORTAL_SPORTS.find((sport) => sport.slug === slug)?.label ?? null;
}

export const PORTAL_STATUS_LABELS: Record<PortalStatus, string> = {
  ENTERED: "In portal",
  COMMITTED: "Committed",
  SIGNED: "Signed",
  ENROLLED: "Enrolled",
  WITHDRAWN: "Withdrawn",
};

export const PORTAL_STATUS_OPTIONS = Object.keys(
  PORTAL_STATUS_LABELS,
) as PortalStatus[];

export function isPortalStatus(value: unknown): value is PortalStatus {
  return typeof value === "string" && value in PORTAL_STATUS_LABELS;
}

const ACADEMIC_YEAR_LABELS: Record<AcademicYear, string> = {
  FR: "Freshman",
  SO: "Sophomore",
  JR: "Junior",
  SR: "Senior",
  GR: "Graduate",
};

export function formatAcademicYear(
  year: AcademicYear | null,
  isRedshirt: boolean,
) {
  if (!year) return null;
  return isRedshirt
    ? `Redshirt ${ACADEMIC_YEAR_LABELS[year].toLowerCase()}`
    : ACADEMIC_YEAR_LABELS[year];
}

export function formatAcademicYearShort(
  year: AcademicYear | null,
  isRedshirt: boolean,
) {
  if (!year) return null;
  return isRedshirt ? `RS ${year}` : year;
}

export function formatHeight(inches: number | null) {
  if (!inches) return null;
  return `${Math.floor(inches / 12)}-${inches % 12}`;
}

export function formatWeight(pounds: number | null) {
  return pounds ? `${pounds} lbs` : null;
}

const portalDateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPortalDate(date: Date | string | null) {
  if (!date) return null;
  return portalDateFormat.format(new Date(date));
}

export function playerFullName(player: {
  firstName: string;
  lastName: string;
}) {
  return `${player.firstName} ${player.lastName}`;
}

export function schoolDisplayName(
  school: { shortName: string | null; name: string | null } | null,
) {
  return school?.shortName ?? school?.name ?? null;
}
