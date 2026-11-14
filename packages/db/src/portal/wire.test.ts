import { describe, expect, it } from "vitest";

import type { PublishedWireRow } from "./published";
import {
  currentCycleYear,
  type PortalWireData,
  sliceWire,
  wirePlayerCount,
} from "./wire";

const row = (
  eventId: number,
  schoolId: string,
  origin: string,
): PublishedWireRow => ({
  v: 1,
  eventId,
  type: "committed",
  occurredAt: "2026-01-05T00:00:00.000Z",
  superseded: false,
  playerId: 100000 + eventId,
  slug: "a-b",
  firstName: "A",
  lastName: "B",
  isGradTransfer: false,
  recruitmentId: eventId,
  status: "committed",
  schoolId,
  origin: {
    schoolId: origin,
    divisionId: "d1",
    subdivisionId: "fcs",
    conferenceId: "big-sky",
  },
  destination: { schoolId, divisionId: "d1", conferenceId: "mw" },
});

describe("currentCycleYear", () => {
  it("rolls over in July", () => {
    expect(currentCycleYear(new Date(Date.UTC(2026, 5, 30)))).toBe(2026);
    expect(currentCycleYear(new Date(Date.UTC(2026, 6, 1)))).toBe(2027);
    expect(currentCycleYear(new Date(Date.UTC(2026, 11, 15)))).toBe(2027);
  });
});

describe("sliceWire", () => {
  it("keeps the newest players whole, and only what they name", () => {
    const data: PortalWireData = {
      v: 1,
      sport: { slug: "football", name: "Football" },
      cycleYear: 2026,
      rows: [
        row(3, "boise", "montana"),
        row(2, "idaho", "weber"),
        row(1, "utah", "csu"),
        // An older move of the newest player: kept with them.
        { ...row(0, "boise", "montana"), recruitmentId: 3 },
      ],
      schools: Object.fromEntries(
        ["boise", "montana", "idaho", "weber", "utah", "csu"].map((id) => [
          id,
          {
            name: id,
            shortName: null,
            abbreviation: null,
            slug: null,
            image: null,
          },
        ]),
      ),
      levels: {
        d1: { name: "NCAA DI", slug: "d1", parentId: null },
        fcs: { name: "FCS", slug: "fcs", parentId: "d1" },
        fbs: { name: "FBS", slug: "fbs", parentId: "d1" },
      },
      conferences: {
        "big-sky": { name: "Big Sky", shortName: null },
        mw: { name: "Mountain West", shortName: null },
        other: { name: "Other", shortName: null },
      },
    };
    const sliced = sliceWire(data, 2);
    expect(sliced.rows.map((r) => r.eventId)).toEqual([3, 2, 0]);
    expect(wirePlayerCount(sliced.rows)).toBe(2);
    expect(wirePlayerCount(data.rows)).toBe(3);
    expect(Object.keys(sliced.schools).sort()).toEqual([
      "boise",
      "idaho",
      "montana",
      "weber",
    ]);
    // Every level stays, for the division filter.
    expect(Object.keys(sliced.levels).sort()).toEqual(["d1", "fbs", "fcs"]);
    expect(Object.keys(sliced.conferences).sort()).toEqual(["big-sky", "mw"]);
    expect(sliceWire(data, 10).rows).toHaveLength(4);
  });
});
