import { describe, expect, it } from "vitest";

import type { RecruitmentEventType } from "./constants";
import {
  type RecruitmentEventInput,
  RecruitmentTransitionError,
  reduceRecruitment,
} from "./reduce-recruitment";

let nextId = 1;
const day = (n: number) => new Date(Date.UTC(2027, 0, n));

function event(
  type: RecruitmentEventType,
  dayOfMonth: number,
  schoolId: string | null = null,
  extra: Partial<RecruitmentEventInput> = {},
): RecruitmentEventInput {
  return {
    id: nextId++,
    type,
    occurredAt: day(dayOfMonth),
    schoolId,
    schoolName: null,
    ...extra,
  };
}

describe("reduceRecruitment", () => {
  it("has no status before the player enters", () => {
    expect(reduceRecruitment([])).toMatchObject({
      status: null,
      closedAt: null,
      destination: null,
    });
  });

  it("enter, commit, re-enter, commit, enroll in one window is one recruitment", () => {
    const first = event("committed", 5, "sac-state");
    const events = [
      event("entered", 2),
      first,
      event("decommitted", 7, "sac-state"),
      event("committed", 9, "boise-state"),
      event("enrolled", 14, "boise-state"),
    ];

    const steps = events.map((_, index) =>
      reduceRecruitment(events.slice(0, index + 1)),
    );

    expect(steps.map((step) => step.status)).toEqual([
      "entered",
      "committed",
      "entered",
      "committed",
      "enrolled",
    ]);
    expect(steps.map((step) => step.closedAt !== null)).toEqual([
      false,
      false,
      false,
      false,
      true,
    ]);
    const final = steps[4]!;
    expect(final.destination?.schoolId).toBe("boise-state");
    expect(final.enteredAt).toEqual(day(2));
    expect(final.statusAt).toEqual(day(14));
    expect(final.closedAt).toEqual(day(14));
    expect(final.supersededEventIds).toEqual([first.id]);
  });

  it("returns to entered with no destination after a decommit", () => {
    const state = reduceRecruitment([
      event("entered", 2),
      event("committed", 5, "sac-state"),
      event("decommitted", 7, "sac-state"),
    ]);
    expect(state).toMatchObject({
      status: "entered",
      destination: null,
      closedAt: null,
    });
    expect(state.statusAt).toEqual(day(7));
    expect(state.enteredAt).toEqual(day(2));
  });

  it("a withdrawal closes the recruitment and drops any commitment", () => {
    const commit = event("committed", 5, "sac-state");
    const state = reduceRecruitment([
      event("entered", 2),
      commit,
      event("withdrew", 8),
    ]);
    expect(state).toMatchObject({ status: "withdrawn", destination: null });
    expect(state.closedAt).toEqual(day(8));
    expect(state.supersededEventIds).toEqual([commit.id]);
  });

  it("signing keeps the destination and stays open", () => {
    const state = reduceRecruitment([
      event("entered", 2),
      event("committed", 5, "boise-state"),
      event("signed", 6, "boise-state"),
    ]);
    expect(state).toMatchObject({ status: "signed", closedAt: null });
    expect(state.destination?.schoolId).toBe("boise-state");
  });

  it("a player can enroll without a reported commitment", () => {
    const state = reduceRecruitment([
      event("entered", 2),
      event("enrolled", 14, "boise-state"),
    ]);
    expect(state.status).toBe("enrolled");
    expect(state.destination?.schoolId).toBe("boise-state");
  });

  it("offers are collected and never change status", () => {
    const state = reduceRecruitment([
      event("entered", 2),
      event("offered", 3, "idaho"),
      event("offered", 3, null, { schoolName: "Carroll College" }),
      event("committed", 5, "boise-state"),
      event("offered", 6, "uc-davis"),
    ]);
    expect(state.status).toBe("committed");
    expect(
      state.offers.map((offer) => offer.schoolId ?? offer.schoolName),
    ).toEqual(["idaho", "Carroll College", "uc-davis"]);
  });

  it("matches free-text schools by name, ignoring case and spacing", () => {
    const state = reduceRecruitment([
      event("entered", 2),
      event("committed", 5, null, { schoolName: "Carroll College" }),
      event("decommitted", 7, null, { schoolName: " carroll college " }),
    ]);
    expect(state.status).toBe("entered");
  });

  it("ignores voided events", () => {
    const state = reduceRecruitment([
      event("entered", 2),
      event("committed", 5, "sac-state", { voidedAt: day(6) }),
      event("committed", 9, "boise-state"),
    ]);
    expect(state.status).toBe("committed");
    expect(state.destination?.schoolId).toBe("boise-state");
    expect(state.supersededEventIds).toEqual([]);
  });

  it("orders by time, not by the order events were typed in", () => {
    const state = reduceRecruitment([
      event("committed", 5, "boise-state"),
      event("entered", 2),
    ]);
    expect(state.status).toBe("committed");
  });

  it.each<[string, RecruitmentEventInput[]]>([
    ["commit before entering", [event("committed", 5, "boise-state")]],
    ["offer before entering", [event("offered", 1, "idaho")]],
    ["entering twice", [event("entered", 2), event("entered", 3)]],
    [
      "committing elsewhere without a decommit",
      [
        event("entered", 2),
        event("committed", 5, "sac-state"),
        event("committed", 6, "boise-state"),
      ],
    ],
    [
      "decommitting from a school they never committed to",
      [
        event("entered", 2),
        event("committed", 5, "sac-state"),
        event("decommitted", 6, "boise-state"),
      ],
    ],
    [
      "decommitting with no commitment",
      [event("entered", 2), event("decommitted", 6, "boise-state")],
    ],
    [
      "enrolling somewhere other than the commitment",
      [
        event("entered", 2),
        event("committed", 5, "sac-state"),
        event("enrolled", 9, "boise-state"),
      ],
    ],
    [
      "enrolling after withdrawing",
      [
        event("entered", 2),
        event("withdrew", 5),
        event("enrolled", 9, "boise-state"),
      ],
    ],
    [
      "anything after enrolling",
      [
        event("entered", 2),
        event("enrolled", 9, "boise-state"),
        event("offered", 10, "idaho"),
      ],
    ],
    [
      "the same school offering twice",
      [
        event("entered", 2),
        event("offered", 3, "idaho"),
        event("offered", 4, "idaho"),
      ],
    ],
  ])("rejects %s", (_label, events) => {
    expect(() => reduceRecruitment(events)).toThrow(RecruitmentTransitionError);
  });
});
