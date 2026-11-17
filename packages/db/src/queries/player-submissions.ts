import { and, desc, eq, lt, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import type { PlayerSubmissionStatus } from "../portal/constants";
import {
  type SubmissionPayload,
  type Submitter,
  submissionPayloadSchema,
} from "../portal/submission";
import { playerSubmissionsTable, usersTable } from "../schema";

// The public "report a move" inbox. A submission never touches the player
// tables: an editor reads it and enters the move themselves.

/** Store a submission from the public form. Inputs are validated by the caller. */
export async function createPlayerSubmission(
  input: Submitter & { payload: SubmissionPayload },
) {
  const [row] = await db
    .insert(playerSubmissionsTable)
    .values({
      submitterRole: input.submitterRole,
      submitterName: input.submitterName,
      submitterEmail: input.submitterEmail,
      payload: input.payload,
    })
    .returning({ id: playerSubmissionsTable.id });
  if (!row) throw new Error("Submission insert returned no row.");
  return row;
}

const inboxColumns = {
  id: playerSubmissionsTable.id,
  status: playerSubmissionsTable.status,
  submitterRole: playerSubmissionsTable.submitterRole,
  submitterName: playerSubmissionsTable.submitterName,
  submitterEmail: playerSubmissionsTable.submitterEmail,
  payload: playerSubmissionsTable.payload,
  matchedPlayerId: playerSubmissionsTable.matchedPlayerId,
  reviewNote: playerSubmissionsTable.reviewNote,
  reviewedAt: playerSubmissionsTable.reviewedAt,
  createdAt: playerSubmissionsTable.createdAt,
};

interface InboxRow {
  id: number;
  status: string;
  submitterRole: string;
  submitterName: string | null;
  submitterEmail: string;
  payload: unknown;
  matchedPlayerId: number | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

/** A stored row with its payload parsed; null when the payload is unreadable. */
function toSubmission(row: InboxRow) {
  const parsed = submissionPayloadSchema.safeParse(row.payload);
  return {
    ...row,
    status: row.status as PlayerSubmissionStatus,
    payload: parsed.success ? parsed.data : null,
  };
}

export type PlayerSubmission = ReturnType<typeof toSubmission>;

export const SUBMISSIONS_PAGE_SIZE = 25;

/**
 * Submissions with a status, newest first, a page at a time (keyset on id,
 * using the `(status, created_at)` index's order; ids rise with time).
 */
export async function listPlayerSubmissions(input: {
  status: PlayerSubmissionStatus;
  beforeId?: number;
}) {
  const rows = await db
    .select({
      ...inboxColumns,
      reviewer: sql<
        string | null
      >`nullif(trim(${usersTable.firstName} || ' ' || ${usersTable.lastName}), '')`,
    })
    .from(playerSubmissionsTable)
    .leftJoin(
      usersTable,
      eq(usersTable.id, playerSubmissionsTable.reviewedByUserId),
    )
    .where(
      and(
        eq(playerSubmissionsTable.status, input.status),
        input.beforeId
          ? lt(playerSubmissionsTable.id, input.beforeId)
          : undefined,
      ),
    )
    .orderBy(desc(playerSubmissionsTable.id))
    .limit(SUBMISSIONS_PAGE_SIZE + 1);
  return {
    submissions: rows
      .slice(0, SUBMISSIONS_PAGE_SIZE)
      .map(({ reviewer, ...row }) => ({ ...toSubmission(row), reviewer })),
    hasMore: rows.length > SUBMISSIONS_PAGE_SIZE,
  };
}

export async function getPlayerSubmission(id: number) {
  const [row] = await db
    .select(inboxColumns)
    .from(playerSubmissionsTable)
    .where(eq(playerSubmissionsTable.id, id));
  return row ? toSubmission(row) : null;
}

/** How many are waiting, for the inbox badge. */
export async function countNewPlayerSubmissions() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playerSubmissionsTable)
    .where(eq(playerSubmissionsTable.status, "new"));
  return Number(row?.count ?? 0);
}

/**
 * Record what an editor decided. `matchedPlayerId` ties an accepted
 * submission to the player it was entered for. Returns false for an unknown id.
 */
export async function reviewPlayerSubmission(input: {
  id: number;
  status: Exclude<PlayerSubmissionStatus, "new">;
  matchedPlayerId?: number | null;
  reviewNote?: string | null;
  reviewerUserId?: string | null;
}) {
  const updated = await db
    .update(playerSubmissionsTable)
    .set({
      status: input.status,
      matchedPlayerId: input.matchedPlayerId ?? null,
      reviewNote: input.reviewNote ?? null,
      reviewedByUserId: input.reviewerUserId ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(playerSubmissionsTable.id, input.id))
    .returning({ id: playerSubmissionsTable.id });
  return updated.length > 0;
}
