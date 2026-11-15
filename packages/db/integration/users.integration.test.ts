import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  isUserAssignedToPoll,
  revokeAssignmentsForNonVoters,
} from "../src/queries/polls";
import {
  createUser,
  deactivateUser,
  listStaffUsers,
  searchUsersByName,
  setUserRoles,
  updateUser,
} from "../src/queries/users";
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

describe("staff roles", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("lists admins and anyone with a role, by last name", async () => {
    await createUser({ id: "u1", firstName: "Zach", lastName: "McKinnell" });
    await createUser({
      id: "u2",
      firstName: "Old",
      lastName: "Admin",
      isAdmin: true,
    });
    await createUser({
      id: "u3",
      firstName: "Just",
      lastName: "Voter",
      isVoter: true,
    });
    await setUserRoles({
      id: "u1",
      roles: ["portal", "ballots"],
      isAdmin: false,
    });

    const staff = await listStaffUsers();
    expect(staff.map((row) => [row.id, row.roles, row.isAdmin])).toEqual([
      ["u2", [], true],
      ["u1", ["portal", "ballots"], false],
    ]);
  });

  it("copies roles from the webhook and keeps them when the payload omits them", async () => {
    await updateUser({
      id: "u1",
      ...baseFields,
      isVoter: true,
      roles: ["portal"],
    });
    expect((await getUser("u1"))?.roles).toEqual(["portal"]);
    await updateUser({ id: "u1", ...baseFields, isVoter: true });
    expect((await getUser("u1"))?.roles).toEqual(["portal"]);
  });

  it("rejects anything that isn't a staff role, including admin", async () => {
    await createUser({ id: "u1", firstName: "A", lastName: "B" });
    await expect(
      setUserRoles({ id: "u1", roles: ["superuser"], isAdmin: false }),
    ).rejects.toThrow();
    // Admin is `isAdmin`, not a role.
    await expect(
      setUserRoles({ id: "u1", roles: ["admin"], isAdmin: true }),
    ).rejects.toThrow();
  });

  it("drops roles when the account is deleted", async () => {
    await createUser({
      id: "u1",
      firstName: "A",
      lastName: "B",
      roles: ["portal"],
      isAdmin: true,
    });
    await deactivateUser("u1");
    expect(await getUser("u1")).toMatchObject({ roles: [], isAdmin: false });
  });

  it("finds accounts by the start of a first or last name, safely", async () => {
    await createUser({ id: "u1", firstName: "Zach", lastName: "McKinnell" });
    await createUser({ id: "u2", firstName: "Mack", lastName: "Zane" });
    await createUser({ id: "u3", firstName: "100%", lastName: "Real" });
    expect((await searchUsersByName("za")).map((row) => row.id)).toEqual([
      "u1",
      "u2",
    ]);
    expect((await searchUsersByName(" mck ")).map((row) => row.id)).toEqual([
      "u1",
    ]);
    // `%` and `_` are matched literally, not as wildcards.
    expect((await searchUsersByName("%")).map((row) => row.id)).toEqual([]);
    expect((await searchUsersByName("100%")).map((row) => row.id)).toEqual([
      "u3",
    ]);
    expect(await searchUsersByName("za", 1)).toHaveLength(1);
  });
});
