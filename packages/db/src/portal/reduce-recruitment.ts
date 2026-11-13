import type { RecruitmentEventType, RecruitmentStatus } from "./constants";

export interface RecruitmentEventInput {
  id: number;
  type: RecruitmentEventType;
  occurredAt: Date;
  schoolId: string | null;
  schoolName: string | null;
  voidedAt?: Date | null;
}

export interface RecruitmentSchool {
  schoolId: string | null;
  schoolName: string | null;
}

export interface RecruitmentOffer extends RecruitmentSchool {
  eventId: number;
  occurredAt: Date;
}

export interface RecruitmentState {
  /** Null until an `entered` event exists. */
  status: RecruitmentStatus | null;
  statusAt: Date | null;
  enteredAt: Date | null;
  /** Set while committed, signed, or enrolled. */
  destination: RecruitmentSchool | null;
  /** Set once the recruitment ends in `enrolled` or `withdrawn`. */
  closedAt: Date | null;
  offers: RecruitmentOffer[];
  /** Commit and sign events later undone by a decommit, for the wire's struck-through rows. */
  supersededEventIds: number[];
}

export class RecruitmentTransitionError extends Error {
  constructor(
    message: string,
    readonly eventId: number,
  ) {
    super(message);
    this.name = "RecruitmentTransitionError";
  }
}

function sameSchool(a: RecruitmentSchool, b: RecruitmentSchool) {
  if (a.schoolId && b.schoolId) return a.schoolId === b.schoolId;
  if (a.schoolId || b.schoolId) return false;
  return (
    (a.schoolName ?? "").trim().toLowerCase() ===
    (b.schoolName ?? "").trim().toLowerCase()
  );
}

/** Voided events dropped, oldest first; ties broken by id so the order is stable. */
export function liveEventsInOrder<T extends RecruitmentEventInput>(
  events: readonly T[],
): T[] {
  return events
    .filter((event) => !event.voidedAt)
    .sort(
      (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.id - b.id,
    );
}

/**
 * The single source of truth for what a recruitment's events add up to.
 *
 * A recruitment opens with `entered` and stays open, through any number of
 * commit / decommit rounds, until the player enrolls somewhere or withdraws.
 * Offers never change status. Throws on a sequence that cannot happen (commit
 * before entering, anything after the recruitment closed).
 */
export function reduceRecruitment(
  events: readonly RecruitmentEventInput[],
): RecruitmentState {
  const state: RecruitmentState = {
    status: null,
    statusAt: null,
    enteredAt: null,
    destination: null,
    closedAt: null,
    offers: [],
    supersededEventIds: [],
  };
  /** Commit/sign events backing the current destination. */
  let pledgeEventIds: number[] = [];

  for (const event of liveEventsInOrder(events)) {
    const school: RecruitmentSchool = {
      schoolId: event.schoolId,
      schoolName: event.schoolName,
    };
    const fail = (message: string): never => {
      throw new RecruitmentTransitionError(message, event.id);
    };
    const setStatus = (status: RecruitmentStatus) => {
      state.status = status;
      state.statusAt = event.occurredAt;
    };

    if (state.closedAt) {
      fail(`Recruitment already ended as ${state.status}.`);
    }
    if (state.status === null && event.type !== "entered") {
      fail("A recruitment must start with the player entering.");
    }

    switch (event.type) {
      case "entered":
        if (state.status !== null) fail("Player has already entered.");
        state.enteredAt = event.occurredAt;
        setStatus("entered");
        break;

      case "offered":
        if (state.offers.some((offer) => sameSchool(offer, school))) {
          fail("That school has already offered.");
        }
        state.offers.push({
          eventId: event.id,
          occurredAt: event.occurredAt,
          ...school,
        });
        break;

      case "committed":
        if (state.status !== "entered") {
          fail("Player must decommit before committing elsewhere.");
        }
        state.destination = school;
        pledgeEventIds = [event.id];
        setStatus("committed");
        break;

      case "signed":
        if (state.status === "signed") fail("Player has already signed.");
        if (state.destination && !sameSchool(state.destination, school)) {
          fail("Player is committed to a different school.");
        }
        state.destination = school;
        pledgeEventIds.push(event.id);
        setStatus("signed");
        break;

      case "decommitted":
        if (!state.destination) fail("Player has no commitment to drop.");
        if (!sameSchool(state.destination as RecruitmentSchool, school)) {
          fail("Player is committed to a different school.");
        }
        state.supersededEventIds.push(...pledgeEventIds);
        pledgeEventIds = [];
        state.destination = null;
        setStatus("entered");
        break;

      case "enrolled":
        if (state.destination && !sameSchool(state.destination, school)) {
          fail("Player is committed to a different school.");
        }
        state.destination = school;
        setStatus("enrolled");
        state.closedAt = event.occurredAt;
        break;

      case "withdrew":
        state.supersededEventIds.push(...pledgeEventIds);
        pledgeEventIds = [];
        state.destination = null;
        setStatus("withdrawn");
        state.closedAt = event.occurredAt;
        break;
    }
  }

  return state;
}
