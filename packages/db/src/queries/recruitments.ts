import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import type {
  EventSourceType,
  PlayerClassCode,
  RecruitmentEventType,
  RecruitmentKind,
} from "../portal/constants";
import {
  type RecruitmentEventInput,
  type RecruitmentSchool,
  type RecruitmentState,
  RecruitmentTransitionError,
  reduceRecruitment,
} from "../portal/reduce-recruitment";
import {
  conferenceSportSubdivisionsTable,
  conferencesTable,
  divisionsTable,
  playerEnrollmentsTable,
  playerSportsTable,
  recruitmentEventsTable,
  recruitmentsTable,
  type SelectRecruitment,
  type SelectRecruitmentEvent,
  schoolConferenceAffiliationsTable,
} from "../schema";
import {
  type DbExecutor,
  type DbTransaction,
  ensurePlayerSport,
  lockPlayer,
  markPlayerPending,
  type PlayerSportAttributes,
  PortalWriteError,
  requireActivePlayer,
  writePlayerAudit,
} from "./players";

/** A school we have a row for, or the name of one we don't (NAIA, JUCO). */
export interface SchoolRef {
  schoolId?: string | null;
  schoolName?: string | null;
}

export interface EventSource {
  sourceType?: EventSourceType | null;
  sourceUrl?: string | null;
  sourceNote?: string | null;
}

const toSchool = (ref: SchoolRef | null | undefined): RecruitmentSchool => ({
  schoolId: ref?.schoolId ?? null,
  // A known school never also stores a free-text name.
  schoolName: ref?.schoolId ? null : ref?.schoolName?.trim() || null,
});

function sameSchool(a: RecruitmentSchool, b: RecruitmentSchool) {
  if (a.schoolId || b.schoolId) return a.schoolId === b.schoolId;
  return (
    (a.schoolName ?? "").trim().toLowerCase() ===
    (b.schoolName ?? "").trim().toLowerCase()
  );
}

// Every query here names its columns. Supabase bills for bytes leaving the
// database, so nothing selects or returns a whole row: a wide column added
// later (a headshot, a long note) must not start riding along on every write.

/** What the reducer needs from an event, and nothing else. */
const reducerEventColumns = {
  id: recruitmentEventsTable.id,
  type: recruitmentEventsTable.type,
  occurredAt: recruitmentEventsTable.occurredAt,
  schoolId: recruitmentEventsTable.schoolId,
  schoolName: recruitmentEventsTable.schoolName,
  voidedAt: recruitmentEventsTable.voidedAt,
};
type ReducerEventRow = Pick<
  SelectRecruitmentEvent,
  keyof typeof reducerEventColumns
>;

/** The recruitment columns the write path reads and hands back. */
const recruitmentColumns = {
  id: recruitmentsTable.id,
  playerSportId: recruitmentsTable.playerSportId,
  cycleYear: recruitmentsTable.cycleYear,
  originEnrollmentId: recruitmentsTable.originEnrollmentId,
  originSchoolId: recruitmentsTable.originSchoolId,
  originSchoolName: recruitmentsTable.originSchoolName,
  originConferenceId: recruitmentsTable.originConferenceId,
  originDivisionId: recruitmentsTable.originDivisionId,
  originSubdivisionId: recruitmentsTable.originSubdivisionId,
  status: recruitmentsTable.status,
  statusAt: recruitmentsTable.statusAt,
  enteredAt: recruitmentsTable.enteredAt,
  destinationSchoolId: recruitmentsTable.destinationSchoolId,
  destinationSchoolName: recruitmentsTable.destinationSchoolName,
  destinationConferenceId: recruitmentsTable.destinationConferenceId,
  destinationDivisionId: recruitmentsTable.destinationDivisionId,
  destinationSubdivisionId: recruitmentsTable.destinationSubdivisionId,
  closedAt: recruitmentsTable.closedAt,
};
export type RecruitmentSummary = Pick<
  SelectRecruitment,
  keyof typeof recruitmentColumns
>;

const toReducerEvent = (event: ReducerEventRow): RecruitmentEventInput => ({
  id: event.id,
  type: event.type as RecruitmentEventType,
  occurredAt: event.occurredAt,
  schoolId: event.schoolId,
  schoolName: event.schoolName,
  voidedAt: event.voidedAt,
});

/** Run the reducer, turning an impossible sequence into an error the admin form can show. */
function reduceOrReject(events: RecruitmentEventInput[]): RecruitmentState {
  try {
    return reduceRecruitment(events);
  } catch (error) {
    if (error instanceof RecruitmentTransitionError) {
      throw new PortalWriteError("invalid_transition", error.message);
    }
    throw error;
  }
}

export type SchoolPlacement = {
  conferenceId: string | null;
  divisionId: string | null;
  /** FBS, FCS, Mid-Major, or Power Conferences; null where the level has none. */
  subdivisionId: string | null;
};

const NO_PLACEMENT: SchoolPlacement = {
  conferenceId: null,
  divisionId: null,
  subdivisionId: null,
};

/**
 * A school's conference, division, and subdivision for a sport right now, to
 * snapshot onto a recruitment. The subdivision is the school's own override
 * when it has one, else its conference's for the sport. Null where we have no
 * affiliation on file.
 */
export async function getSchoolPlacement(
  executor: DbExecutor,
  schoolId: string | null,
  sportId: string,
): Promise<SchoolPlacement> {
  if (!schoolId) return NO_PLACEMENT;
  const [row] = await executor
    .select({
      conferenceId: conferencesTable.id,
      // `conferences.division_id` has no foreign key; only trust ids that resolve.
      divisionId: divisionsTable.id,
      subdivisionId: sql<
        string | null
      >`coalesce(${schoolConferenceAffiliationsTable.subdivisionOverrideId}, ${conferenceSportSubdivisionsTable.subdivisionId})`,
    })
    .from(schoolConferenceAffiliationsTable)
    .innerJoin(
      conferencesTable,
      eq(conferencesTable.id, schoolConferenceAffiliationsTable.conferenceId),
    )
    .leftJoin(
      divisionsTable,
      eq(divisionsTable.id, conferencesTable.divisionId),
    )
    .leftJoin(
      conferenceSportSubdivisionsTable,
      and(
        eq(conferenceSportSubdivisionsTable.conferenceId, conferencesTable.id),
        eq(conferenceSportSubdivisionsTable.sportId, sportId),
      ),
    )
    .where(
      and(
        eq(schoolConferenceAffiliationsTable.schoolId, schoolId),
        eq(schoolConferenceAffiliationsTable.sportId, sportId),
      ),
    )
    .orderBy(asc(conferencesTable.id))
    .limit(1);
  return {
    conferenceId: row?.conferenceId ?? null,
    divisionId: row?.divisionId ?? null,
    subdivisionId: row?.subdivisionId ?? null,
  };
}

async function loadRecruitmentForUpdate(
  tx: DbTransaction,
  recruitmentId: number,
) {
  const [row] = await tx
    .select({
      recruitment: recruitmentColumns,
      playerId: playerSportsTable.playerId,
      sportId: playerSportsTable.sportId,
    })
    .from(recruitmentsTable)
    .innerJoin(
      playerSportsTable,
      eq(playerSportsTable.id, recruitmentsTable.playerSportId),
    )
    .where(eq(recruitmentsTable.id, recruitmentId))
    .for("update", { of: recruitmentsTable });
  return row ?? null;
}

async function findPlayerIdForRecruitment(recruitmentId: number) {
  const [row] = await db
    .select({ playerId: playerSportsTable.playerId })
    .from(recruitmentsTable)
    .innerJoin(
      playerSportsTable,
      eq(playerSportsTable.id, recruitmentsTable.playerSportId),
    )
    .where(eq(recruitmentsTable.id, recruitmentId));
  return row?.playerId ?? null;
}

/**
 * Keep enrollments in step with a recruitment: enrolling ends the old school
 * and starts the new one; undoing an enrollment puts the player back.
 */
async function syncEnrollment(
  tx: DbTransaction,
  recruitment: RecruitmentSummary,
  state: RecruitmentState,
) {
  const [created] = await tx
    .select({
      id: playerEnrollmentsTable.id,
      schoolId: playerEnrollmentsTable.schoolId,
      schoolName: playerEnrollmentsTable.schoolName,
    })
    .from(playerEnrollmentsTable)
    .where(eq(playerEnrollmentsTable.viaRecruitmentId, recruitment.id));

  if (state.status === "enrolled" && state.destination) {
    if (created) {
      if (!sameSchool(created, state.destination)) {
        await tx
          .update(playerEnrollmentsTable)
          .set(state.destination)
          .where(eq(playerEnrollmentsTable.id, created.id));
      }
      return;
    }
    // Last season at the old school is the one before this cycle, but never
    // earlier than they arrived (a January enrollee who leaves in the spring).
    await tx
      .update(playerEnrollmentsTable)
      .set({
        endYear: sql`greatest(${playerEnrollmentsTable.startYear}, ${recruitment.cycleYear - 1})`,
      })
      .where(
        and(
          eq(playerEnrollmentsTable.playerSportId, recruitment.playerSportId),
          isNull(playerEnrollmentsTable.endYear),
        ),
      );
    await tx.insert(playerEnrollmentsTable).values({
      playerSportId: recruitment.playerSportId,
      ...state.destination,
      startYear: recruitment.cycleYear,
      viaRecruitmentId: recruitment.id,
    });
    return;
  }

  if (!created) return;
  const [dependent] = await tx
    .select({ id: recruitmentsTable.id })
    .from(recruitmentsTable)
    .where(eq(recruitmentsTable.originEnrollmentId, created.id))
    .limit(1);
  if (dependent) {
    throw new PortalWriteError(
      "later_recruitment_exists",
      "A later portal entry starts from this enrollment. Undo that one first.",
    );
  }
  await tx
    .delete(playerEnrollmentsTable)
    .where(eq(playerEnrollmentsTable.id, created.id));
  if (recruitment.originEnrollmentId !== null) {
    await tx
      .update(playerEnrollmentsTable)
      .set({ endYear: null })
      .where(eq(playerEnrollmentsTable.id, recruitment.originEnrollmentId));
  }
}

/** Write the reducer's answer onto the recruitment row and its enrollments. */
async function applyState(
  tx: DbTransaction,
  recruitment: RecruitmentSummary,
  sportId: string,
  state: RecruitmentState,
) {
  if (!state.status || !state.statusAt || !state.enteredAt) {
    throw new PortalWriteError(
      "invalid_transition",
      "A recruitment must keep its entry event.",
    );
  }
  const destination = toSchool(state.destination);
  const unchanged = sameSchool(destination, {
    schoolId: recruitment.destinationSchoolId,
    schoolName: recruitment.destinationSchoolName,
  });
  const placement = unchanged
    ? {
        conferenceId: recruitment.destinationConferenceId,
        divisionId: recruitment.destinationDivisionId,
        subdivisionId: recruitment.destinationSubdivisionId,
      }
    : await getSchoolPlacement(tx, destination.schoolId, sportId);

  const [updated] = await tx
    .update(recruitmentsTable)
    .set({
      status: state.status,
      statusAt: state.statusAt,
      enteredAt: state.enteredAt,
      destinationSchoolId: destination.schoolId,
      destinationSchoolName: destination.schoolName,
      destinationConferenceId: placement.conferenceId,
      destinationDivisionId: placement.divisionId,
      destinationSubdivisionId: placement.subdivisionId,
      closedAt: state.closedAt,
    })
    .where(eq(recruitmentsTable.id, recruitment.id))
    .returning(recruitmentColumns);
  if (!updated) throw new Error("Recruitment update returned no row.");
  await syncEnrollment(tx, updated, state);
  return updated;
}

export interface OpenRecruitmentInput extends EventSource {
  playerId: number;
  sportId: string;
  cycleYear: number;
  kind?: RecruitmentKind;
  /** The school the player is leaving. */
  origin: SchoolRef;
  /** First season at the origin school, if we have no enrollment on file yet. */
  originStartYear?: number;
  enteredAt: Date;
  classAtEntry?: PlayerClassCode | null;
  eligibilityYears?: number | null;
  isGradTransfer?: boolean;
  attributes?: PlayerSportAttributes;
  actorUserId?: string | null;
}

/**
 * A player enters the portal: one recruitment and its `entered` event, created
 * together. Refused while the player already has an open recruitment in the
 * sport, or if `origin` is not the school we have them at.
 */
export async function openRecruitment(input: OpenRecruitmentInput) {
  return db.transaction(async (tx) => {
    await lockPlayer(tx, input.playerId);
    return openRecruitmentLocked(tx, input);
  });
}

/** `openRecruitment` inside a transaction that already holds `lockPlayer`. */
export async function openRecruitmentLocked(
  tx: DbTransaction,
  input: OpenRecruitmentInput,
) {
  await requireActivePlayer(tx, input.playerId);
  const playerSport = await ensurePlayerSport(
    tx,
    input.playerId,
    input.sportId,
    input.attributes,
  );

  const [open] = await tx
    .select({ id: recruitmentsTable.id })
    .from(recruitmentsTable)
    .where(
      and(
        eq(recruitmentsTable.playerSportId, playerSport.id),
        isNull(recruitmentsTable.closedAt),
      ),
    );
  if (open) {
    throw new PortalWriteError(
      "recruitment_open",
      "Player is already in the portal. Record the next move on that entry.",
    );
  }

  const origin = toSchool(input.origin);
  const enrollmentColumns = {
    id: playerEnrollmentsTable.id,
    schoolId: playerEnrollmentsTable.schoolId,
    schoolName: playerEnrollmentsTable.schoolName,
  };
  let [enrollment] = await tx
    .select(enrollmentColumns)
    .from(playerEnrollmentsTable)
    .where(
      and(
        eq(playerEnrollmentsTable.playerSportId, playerSport.id),
        isNull(playerEnrollmentsTable.endYear),
      ),
    );
  if (enrollment && !sameSchool(enrollment, origin)) {
    throw new PortalWriteError(
      "current_school_mismatch",
      "Player's current school on file is different from the one they are leaving.",
    );
  }
  if (!enrollment) {
    [enrollment] = await tx
      .insert(playerEnrollmentsTable)
      .values({
        playerSportId: playerSport.id,
        ...origin,
        startYear: input.originStartYear ?? input.cycleYear - 1,
      })
      .returning(enrollmentColumns);
  }
  if (!enrollment) throw new Error("Enrollment insert returned no row.");

  const placement = await getSchoolPlacement(
    tx,
    origin.schoolId,
    input.sportId,
  );
  const [recruitment] = await tx
    .insert(recruitmentsTable)
    .values({
      playerSportId: playerSport.id,
      kind: input.kind ?? "transfer",
      cycleYear: input.cycleYear,
      originEnrollmentId: enrollment.id,
      originSchoolId: origin.schoolId,
      originSchoolName: origin.schoolName,
      originConferenceId: placement.conferenceId,
      originDivisionId: placement.divisionId,
      originSubdivisionId: placement.subdivisionId,
      classAtEntry: input.classAtEntry ?? null,
      eligibilityYears: input.eligibilityYears ?? null,
      isGradTransfer: input.isGradTransfer ?? false,
      status: "entered",
      statusAt: input.enteredAt,
      enteredAt: input.enteredAt,
    })
    .returning(recruitmentColumns);
  if (!recruitment) throw new Error("Recruitment insert returned no row.");

  const [event] = await tx
    .insert(recruitmentEventsTable)
    .values({
      recruitmentId: recruitment.id,
      type: "entered",
      occurredAt: input.enteredAt,
      sourceType: input.sourceType ?? null,
      sourceUrl: input.sourceUrl ?? null,
      sourceNote: input.sourceNote ?? null,
      createdByUserId: input.actorUserId ?? null,
    })
    .returning({ id: recruitmentEventsTable.id });
  if (!event) throw new Error("Event insert returned no row.");

  await writePlayerAudit(tx, {
    playerId: input.playerId,
    entity: "recruitment_events",
    entityId: event.id,
    action: "entered",
    after: { recruitmentId: recruitment.id, ...origin },
    actorUserId: input.actorUserId,
  });
  await markPlayerPending(tx, input.playerId);
  return { recruitment, event, playerSport };
}

export interface RecordEventInput extends EventSource {
  recruitmentId: number;
  type: Exclude<RecruitmentEventType, "entered">;
  occurredAt: Date;
  /** Required for offer, commit, decommit, sign, enroll. */
  school?: SchoolRef | null;
  actorUserId?: string | null;
}

/**
 * Record the next thing that happened in a recruitment. The whole history is
 * re-reduced with the new event; an impossible sequence writes nothing.
 */
export async function recordRecruitmentEvent(input: RecordEventInput) {
  const playerId = await findPlayerIdForRecruitment(input.recruitmentId);
  if (playerId === null) {
    throw new PortalWriteError(
      "recruitment_not_found",
      "Portal entry not found.",
    );
  }
  return db.transaction(async (tx) => {
    await lockPlayer(tx, playerId);
    const loaded = await loadRecruitmentForUpdate(tx, input.recruitmentId);
    if (!loaded) {
      throw new PortalWriteError(
        "recruitment_not_found",
        "Portal entry not found.",
      );
    }
    const existing = await tx
      .select(reducerEventColumns)
      .from(recruitmentEventsTable)
      .where(eq(recruitmentEventsTable.recruitmentId, input.recruitmentId));

    const school = toSchool(input.school);
    const state = reduceOrReject([
      ...existing.map(toReducerEvent),
      {
        // Sorts after every stored event that shares its timestamp.
        id: Number.MAX_SAFE_INTEGER,
        type: input.type,
        occurredAt: input.occurredAt,
        ...school,
      },
    ]);

    const [event] = await tx
      .insert(recruitmentEventsTable)
      .values({
        recruitmentId: input.recruitmentId,
        type: input.type,
        occurredAt: input.occurredAt,
        ...school,
        sourceType: input.sourceType ?? null,
        sourceUrl: input.sourceUrl ?? null,
        sourceNote: input.sourceNote ?? null,
        createdByUserId: input.actorUserId ?? null,
      })
      .returning({ id: recruitmentEventsTable.id });
    if (!event) throw new Error("Event insert returned no row.");

    const recruitment = await applyState(
      tx,
      loaded.recruitment,
      loaded.sportId,
      state,
    );
    await writePlayerAudit(tx, {
      playerId,
      entity: "recruitment_events",
      entityId: event.id,
      action: input.type,
      before: { status: loaded.recruitment.status },
      after: { status: recruitment.status, ...school },
      actorUserId: input.actorUserId,
    });
    await markPlayerPending(tx, playerId);
    return { recruitment, event, state };
  });
}

/**
 * Take back an event that was wrong. The row stays (voided) and the
 * recruitment is recomputed as if it had never happened.
 */
export async function voidRecruitmentEvent(input: {
  eventId: number;
  reason?: string | null;
  actorUserId?: string | null;
}) {
  const [target] = await db
    .select({ recruitmentId: recruitmentEventsTable.recruitmentId })
    .from(recruitmentEventsTable)
    .where(eq(recruitmentEventsTable.id, input.eventId));
  const playerId = target
    ? await findPlayerIdForRecruitment(target.recruitmentId)
    : null;
  if (!target || playerId === null) {
    throw new PortalWriteError("event_not_found", "Event not found.");
  }

  return db.transaction(async (tx) => {
    await lockPlayer(tx, playerId);
    const loaded = await loadRecruitmentForUpdate(tx, target.recruitmentId);
    if (!loaded) {
      throw new PortalWriteError(
        "recruitment_not_found",
        "Portal entry not found.",
      );
    }
    const existing = await tx
      .select(reducerEventColumns)
      .from(recruitmentEventsTable)
      .where(eq(recruitmentEventsTable.recruitmentId, target.recruitmentId));
    const event = existing.find((row) => row.id === input.eventId);
    if (!event) {
      throw new PortalWriteError("event_not_found", "Event not found.");
    }
    if (event.voidedAt) {
      throw new PortalWriteError(
        "event_already_voided",
        "Event was already voided.",
      );
    }

    const voidedAt = new Date();
    const state = reduceOrReject(
      existing.map((row) =>
        toReducerEvent(row.id === event.id ? { ...row, voidedAt } : row),
      ),
    );

    // Voiding an enroll or withdraw reopens the recruitment, which the
    // one-open-per-sport index forbids if a newer one is already open.
    if (state.closedAt === null && loaded.recruitment.closedAt !== null) {
      const [open] = await tx
        .select({ id: recruitmentsTable.id })
        .from(recruitmentsTable)
        .where(
          and(
            eq(
              recruitmentsTable.playerSportId,
              loaded.recruitment.playerSportId,
            ),
            isNull(recruitmentsTable.closedAt),
          ),
        );
      if (open) {
        throw new PortalWriteError(
          "later_recruitment_exists",
          "Player has a newer open portal entry. Undo that one first.",
        );
      }
    }

    await tx
      .update(recruitmentEventsTable)
      .set({ voidedAt, voidReason: input.reason?.trim() || null })
      .where(eq(recruitmentEventsTable.id, event.id));
    const recruitment = await applyState(
      tx,
      loaded.recruitment,
      loaded.sportId,
      state,
    );
    await writePlayerAudit(tx, {
      playerId,
      entity: "recruitment_events",
      entityId: event.id,
      action: "void",
      before: { type: event.type, status: loaded.recruitment.status },
      after: { status: recruitment.status, reason: input.reason ?? null },
      actorUserId: input.actorUserId,
    });
    await markPlayerPending(tx, playerId);
    return { recruitment, state };
  });
}

/** A recruitment's events, oldest first, voided ones included. */
export function getRecruitmentEvents(
  recruitmentId: number,
  executor: DbExecutor = db,
) {
  return executor
    .select({
      ...reducerEventColumns,
      sourceType: recruitmentEventsTable.sourceType,
      sourceUrl: recruitmentEventsTable.sourceUrl,
      sourceNote: recruitmentEventsTable.sourceNote,
      voidReason: recruitmentEventsTable.voidReason,
    })
    .from(recruitmentEventsTable)
    .where(eq(recruitmentEventsTable.recruitmentId, recruitmentId))
    .orderBy(
      asc(recruitmentEventsTable.occurredAt),
      asc(recruitmentEventsTable.id),
    );
}
