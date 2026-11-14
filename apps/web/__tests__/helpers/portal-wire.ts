import type {
  PortalWireData,
  PublishedWireRow,
} from "@redshirt-sports/db/portal";

let nextId = 1;

/** A published wire row with sensible defaults. */
export function wireRow(
  overrides: Partial<PublishedWireRow> = {},
): PublishedWireRow {
  const eventId = overrides.eventId ?? nextId++;
  return {
    v: 1,
    eventId,
    type: "entered",
    occurredAt: "2026-01-05T17:00:00.000Z",
    superseded: false,
    playerId: 100000 + eventId,
    slug: "jalen-brooks",
    firstName: "Jalen",
    lastName: "Brooks",
    isGradTransfer: false,
    recruitmentId: eventId,
    status: "entered",
    origin: {
      schoolId: "montana",
      divisionId: "d1",
      subdivisionId: "fcs",
      conferenceId: "big-sky",
    },
    ...overrides,
  };
}

export function wireData(rows: PublishedWireRow[]): PortalWireData {
  return {
    v: 1,
    sport: { slug: "football", name: "Football" },
    cycleYear: 2026,
    rows,
    schools: {
      montana: {
        name: "University of Montana",
        shortName: "Montana",
        abbreviation: "UM",
        slug: "montana",
        image: null,
      },
      boise: {
        name: "Boise State University",
        shortName: null,
        abbreviation: null,
        slug: "boise-state",
        image: null,
      },
    },
    levels: {
      d1: { name: "NCAA DI", slug: "d1", parentId: null },
      fcs: { name: "FCS", slug: "fcs", parentId: "d1" },
      fbs: { name: "FBS", slug: "fbs", parentId: "d1" },
      naia: { name: "NAIA", slug: "naia", parentId: null },
    },
    conferences: {
      "big-sky": { name: "Big Sky Conference", shortName: "Big Sky" },
    },
  };
}
