import { and, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  type SelectUser,
  type SelectVoterPollAssignment,
  usersTable,
  voterBallots,
  voterPollAssignments,
} from "../schema";

export type VoterPollAssignmentInput = {
  sportId: string;
  division: string;
};

export async function hasVoterPollAssignment({
  userId,
  sportId,
  division,
}: {
  userId: string;
  sportId: string;
  division: string;
}) {
  const assignment = await db.query.voterPollAssignments.findFirst({
    where: (model, { eq, and }) =>
      and(
        eq(model.userId, userId),
        eq(model.sportId, sportId),
        eq(model.division, division),
      ),
  });

  return !!assignment;
}

export async function getVoterPollAssignments(userId: string) {
  return db.query.voterPollAssignments.findMany({
    where: (model, { eq }) => eq(model.userId, userId),
  });
}

export async function listVotersWithAssignments() {
  return db.query.usersTable.findMany({
    where: (model, { eq }) => eq(model.isVoter, true),
    with: {
      voterPollAssignments: true,
    },
  });
}

export async function setVoterPollAssignments(
  userId: string,
  assignments: VoterPollAssignmentInput[],
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(voterPollAssignments)
      .where(eq(voterPollAssignments.userId, userId));

    if (assignments.length === 0) {
      return;
    }

    await tx.insert(voterPollAssignments).values(
      assignments.map((assignment) => ({
        userId,
        sportId: assignment.sportId,
        division: assignment.division,
      })),
    );
  });

  return getVoterPollAssignments(userId);
}

export async function getAssignedVotersForPoll({
  sportId,
  division,
}: {
  sportId: string;
  division: string;
}) {
  const assignments = await db
    .select({
      userId: voterPollAssignments.userId,
      sportId: voterPollAssignments.sportId,
      division: voterPollAssignments.division,
      createdAt: voterPollAssignments.createdAt,
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      organization: usersTable.organization,
      organizationRole: usersTable.organizationRole,
      isAdmin: usersTable.isAdmin,
      isVoter: usersTable.isVoter,
    })
    .from(voterPollAssignments)
    .innerJoin(usersTable, eq(voterPollAssignments.userId, usersTable.id))
    .where(
      and(
        eq(voterPollAssignments.sportId, sportId),
        eq(voterPollAssignments.division, division),
      ),
    );

  return assignments.map(
    ({
      userId: _userId,
      sportId: assignmentSportId,
      division: assignmentDivision,
      createdAt,
      ...user
    }) => ({
      ...user,
      assignment: {
        userId: user.id,
        sportId: assignmentSportId,
        division: assignmentDivision,
        createdAt,
      } satisfies SelectVoterPollAssignment,
    }),
  );
}

export async function getBallotStatusForWeek({
  sportId,
  division,
  year,
  week,
}: {
  sportId: string;
  division: string;
  year: number;
  week: number;
}): Promise<{ submitted: SelectUser[]; missing: SelectUser[] }> {
  const assignedVoters = await getAssignedVotersForPoll({ sportId, division });

  if (assignedVoters.length === 0) {
    return { submitted: [], missing: [] };
  }

  const assignedUserIds = assignedVoters.map((voter) => voter.id);

  const submittedBallots = await db
    .selectDistinct({ userId: voterBallots.userId })
    .from(voterBallots)
    .where(
      and(
        eq(voterBallots.sportId, sportId),
        eq(voterBallots.division, division),
        eq(voterBallots.year, year),
        eq(voterBallots.week, week),
        inArray(voterBallots.userId, assignedUserIds),
      ),
    );

  const submittedUserIds = new Set(
    submittedBallots.map((ballot) => ballot.userId),
  );

  const submitted: SelectUser[] = [];
  const missing: SelectUser[] = [];

  for (const voter of assignedVoters) {
    const user: SelectUser = {
      id: voter.id,
      firstName: voter.firstName,
      lastName: voter.lastName,
      organization: voter.organization,
      organizationRole: voter.organizationRole,
      isAdmin: voter.isAdmin,
      isVoter: voter.isVoter,
    };

    if (submittedUserIds.has(voter.id)) {
      submitted.push(user);
    } else {
      missing.push(user);
    }
  }

  return { submitted, missing };
}
