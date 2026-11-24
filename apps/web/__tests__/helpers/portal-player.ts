import type {
  PortalPlayerData,
  PublishedPlayerDoc,
  PublishedRecruitment,
} from "@redshirt-sports/db/portal";

import { wireData } from "./portal-wire";

type PlayerSport = PublishedPlayerDoc["sports"][number];

export function recruitment(
  overrides: Partial<PublishedRecruitment> = {},
): PublishedRecruitment {
  return {
    id: 1,
    kind: "transfer",
    cycleYear: 2026,
    status: "committed",
    statusAt: "2026-01-05T17:00:00.000Z",
    enteredAt: "2026-01-02T17:00:00.000Z",
    classAtEntry: "RS-JR",
    isGradTransfer: false,
    origin: {
      schoolId: "montana",
      divisionId: "d1",
      subdivisionId: "fcs",
      conferenceId: "big-sky",
    },
    destination: { schoolId: "boise", divisionId: "d1", subdivisionId: "fbs" },
    events: [
      {
        id: 1,
        type: "entered",
        occurredAt: "2026-01-02T17:00:00.000Z",
        superseded: false,
      },
      {
        id: 2,
        type: "committed",
        occurredAt: "2026-01-05T17:00:00.000Z",
        schoolId: "boise",
        superseded: false,
      },
    ],
    offers: [
      { eventId: 3, occurredAt: "2026-01-03T17:00:00.000Z", schoolId: "boise" },
    ],
    ...overrides,
  };
}

export function playerSport(overrides: Partial<PlayerSport> = {}): PlayerSport {
  return {
    sportId: "football-id",
    sportSlug: "football",
    position: "QB",
    heightIn: 75,
    weightLb: 215,
    enrollments: [{ schoolId: "montana", startYear: 2023 }],
    recruitments: [recruitment()],
    ...overrides,
  };
}

export function playerDoc(
  overrides: Partial<PublishedPlayerDoc> = {},
): PublishedPlayerDoc {
  return {
    v: 1,
    id: 100000,
    slug: "jalen-brooks",
    firstName: "Jalen",
    lastName: "Brooks",
    highSchoolName: "Sentinel",
    hometownCity: "Missoula",
    hometownState: "MT",
    sports: [playerSport()],
    ...overrides,
  };
}

export function playerData(
  overrides: Partial<PortalPlayerData> = {},
): PortalPlayerData {
  const { schools, levels, conferences } = wireData([]);
  return {
    doc: playerDoc(),
    indexable: true,
    publishedAt: "2026-01-06T00:00:00.000Z",
    schools,
    levels,
    conferences,
    mergedIds: [],
    ...overrides,
  };
}
