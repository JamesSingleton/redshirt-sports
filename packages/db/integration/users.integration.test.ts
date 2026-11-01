import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  isUserAssignedToPoll,
  revokeAssignmentsForNonVoters,
} from "../src/queries/polls";
import { createUser, deactivateUser, updateUser } from "../src/queries/users";
import { submitBallot } from "../src/queries/voting";
import { ballotsTable, pollVotersTable, usersTable } from "../src/schema";
import {
  ballotEntries,
  createPollWeekFixture,
  createVoter,
  db,
  resetDatabase,
} from "./fixtures";

async function getUser(id: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
  return user;
}

const baseFields = {
  firstName: "Pat",
  lastName: "Voter",
  organization: "Gazette",
  organizationRole: "Writer",
};

beforeEach(resetDatabase);

describe("createUser (user.created)", () => {
  it("is a no-op when Clerk retries the delivery", async () => {
    await createUser({ id: "user_1", ...baseFields, isVoter: true });
    await expect(
      createUser({ id: "user_1", ...baseFields, firstName: "Retry" }),
    ).resolves.toBeUndefined();

    const user = await getUser("user_1");
    expect(user).toMatchObject({ firstName: "Pat", isVoter: true });
  });

  it("leaves a row inserted by an earlier user.updated alone", async () => {
    await updateUser({
      id: "user_1",
      ...baseFields,
      isAdmin: true,
      isVoter: true,
    });
    // The stale created event carries the sign-up payload.
    await createUser({
      id: "user_1",
      firstName: "Pat",
      lastName: "",
      isVoter: false,
    });

    expect(await getUser("user_1")).toMatchObject({
      lastName: "Voter",
      isAdmin: true,
      isVoter: true,
    });
  });
});

describe("updateUser (user.updated)", () => {
  it("inserts the user when user.created never arrived", async () => {
    await updateUser({ id: "user_1", ...baseFields, isVoter: true });

    expect(await getUser("user_1")).toMatchObject({
      ...baseFields,
      isAdmin: false,
      isVoter: true,
    });
  });

  it("keeps stored values for fields the payload leaves undefined", async () => {
    await updateUser({
      id: "user_1",
      ...baseFields,
      isAdmin: true,
      isVoter: true,
    });
    await updateUser({
      id: "user_1",
      firstName: "Patricia",
      lastName: "Voter",
      organization: undefined,
      organizationRole: undefined,
      isAdmin: undefined,
      isVoter: true,
    });

    expect(await getUser("user_1")).toMatchObject({
      firstName: "Patricia",
      organization: "Gazette",
      organizationRole: "Writer",
      isAdmin: true,
      isVoter: true,
    });
  });
});

describe("removing voter access", () => {
  it("user.deleted keeps the row and ballots but revokes only that voter", async () => {
    const fixture = await createPollWeekFixture();
    const leaving = await createVoter(fixture, { isAdmin: true });
    const staying = await createVoter(fixture);
    for (const voter of [leaving, staying]) {
      await submitBallot({
        pollId: fixture.pollId,
        userId: voter.id,
        weekId: fixture.weekIds[0]!,
        entries: ballotEntries(fixture),
      });
    }

    await deactivateUser(leaving.id);
    await revokeAssignmentsForNonVoters(leaving.id);

    expect(await getUser(leaving.id)).toMatchObject({
      isAdmin: false,
      isVoter: false,
    });
    expect(
      await isUserAssignedToPoll({
        pollId: fixture.pollId,
        userId: leaving.id,
      }),
    ).toBe(false);
    const ballots = await db
      .select({ userId: ballotsTable.userId })
      .from(ballotsTable);
    expect(ballots.map((ballot) => ballot.userId).sort()).toEqual(
      [leaving.id, staying.id].sort(),
    );

    // Everyone else keeps voting access.
    expect(await getUser(staying.id)).toMatchObject({ isVoter: true });
    expect(
      await isUserAssignedToPoll({
        pollId: fixture.pollId,
        userId: staying.id,
      }),
    ).toBe(true);
  });

  it("does not revoke a user who is still a voter", async () => {
    const fixture = await createPollWeekFixture();
    const voter = await createVoter(fixture);

    await revokeAssignmentsForNonVoters(voter.id);

    const [assignment] = await db
      .select({ revokedAt: pollVotersTable.revokedAt })
      .from(pollVotersTable)
      .where(eq(pollVotersTable.userId, voter.id));
    expect(assignment!.revokedAt).toBeNull();
  });
});
