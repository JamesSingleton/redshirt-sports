import { describe, expect, it } from "vitest";

import { playerReferences } from "./player";
import type { PublishedPlayerDoc } from "./published";

describe("playerReferences", () => {
  it("collects every school, level, and conference a doc names", () => {
    const doc: PublishedPlayerDoc = {
      v: 1,
      id: 100000,
      slug: "test-player",
      firstName: "Test",
      lastName: "Player",
      sports: [
        {
          sportId: "football",
          sportSlug: "football",
          enrollments: [
            { schoolId: "montana", startYear: 2023, endYear: 2025 },
            { schoolName: "Carroll College", startYear: 2025 },
          ],
          recruitments: [
            {
              id: 1,
              kind: "transfer",
              cycleYear: 2026,
              status: "committed",
              statusAt: "2026-01-05",
              enteredAt: "2026-01-02",
              isGradTransfer: false,
              origin: {
                schoolId: "montana",
                divisionId: "d1",
                subdivisionId: "fcs",
                conferenceId: "big-sky",
              },
              destination: { schoolId: "idaho", divisionId: "d1" },
              events: [
                {
                  id: 1,
                  type: "committed",
                  occurredAt: "2026-01-05",
                  schoolId: "weber",
                  superseded: false,
                },
              ],
              offers: [
                { eventId: 2, occurredAt: "2026-01-03", schoolId: "uc-davis" },
              ],
            },
            {
              id: 2,
              kind: "transfer",
              cycleYear: 2025,
              status: "entered",
              statusAt: "2025-01-05",
              enteredAt: "2025-01-02",
              isGradTransfer: false,
              origin: { schoolName: "Somewhere JC" },
              events: [],
              offers: [],
            },
          ],
        },
      ],
    };
    const refs = playerReferences(doc);
    expect([...refs.schools].sort()).toEqual([
      "idaho",
      "montana",
      "uc-davis",
      "weber",
    ]);
    expect([...refs.levels].sort()).toEqual(["d1", "fcs"]);
    expect([...refs.conferences]).toEqual(["big-sky"]);
  });
});
