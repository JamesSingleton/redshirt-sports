import type {
  PortalEntry,
  PortalPlayerSummary,
  PortalSchool,
} from "@redshirt-sports/db/queries";

export function portalSchool(overrides: Partial<PortalSchool> = {}) {
  return {
    id: "school-1",
    name: "Montana State University",
    shortName: "Montana State",
    abbreviation: "MSU",
    slug: "montana-state",
    image: null,
    ...overrides,
  } satisfies PortalSchool;
}

export function portalPlayer(overrides: Partial<PortalPlayerSummary> = {}) {
  return {
    id: "player-1",
    slug: "jane-doe",
    firstName: "Jane",
    lastName: "Doe",
    position: "QB",
    heightInches: 74,
    weightLbs: 210,
    academicYear: "JR",
    isRedshirt: false,
    ...overrides,
  } satisfies PortalPlayerSummary;
}

export function portalEntry(overrides: Partial<PortalEntry> = {}): PortalEntry {
  return {
    id: "entry-1",
    portalYear: 2026,
    status: "ENTERED",
    enteredAt: new Date("2026-01-05T00:00:00.000Z"),
    committedAt: null,
    signedAt: null,
    enrolledAt: null,
    withdrawnAt: null,
    eventDate: new Date("2026-01-05T00:00:00.000Z"),
    player: portalPlayer(),
    fromSchool: portalSchool(),
    toSchool: null,
    ...overrides,
  };
}
