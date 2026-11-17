import { beforeEach, describe, expect, it } from "vitest";

import { submissionPayloadSchema } from "../src/portal/submission";
import {
  countNewPlayerSubmissions,
  createPlayerSubmission,
  getPlayerSubmission,
  listPlayerSubmissions,
  reviewPlayerSubmission,
  SUBMISSIONS_PAGE_SIZE,
} from "../src/queries/player-submissions";
import { createPortalPlayer } from "../src/queries/portal-admin";
import { createUser } from "../src/queries/users";
import {
  playerSubmissionsTable,
  playersTable,
  publishedPlayersTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const payload = submissionPayloadSchema.parse({
  playerFirstName: "Test",
  playerLastName: "Player",
  sportSlug: "football",
  currentSchool: "Montana",
  move: "entered",
});
const submit = (email = "coach@example.test") =>
  createPlayerSubmission({
    submitterRole: "coach",
    submitterName: "Test Coach",
    submitterEmail: email,
    payload,
  });

beforeEach(async () => {
  await resetDatabase();
});

describe("player submissions", () => {
  it("stores a submission as new without touching players", async () => {
    const { id } = await submit();
    expect(await getPlayerSubmission(id)).toMatchObject({
      id,
      status: "new",
      submitterRole: "coach",
      submitterEmail: "coach@example.test",
      payload: { playerLastName: "Player", move: "entered" },
      matchedPlayerId: null,
    });
    expect(await countNewPlayerSubmissions()).toBe(1);
    expect(await db.select({ id: playersTable.id }).from(playersTable)).toEqual(
      [],
    );
    expect(
      await db
        .select({ id: publishedPlayersTable.playerId })
        .from(publishedPlayersTable),
    ).toEqual([]);
    expect(await getPlayerSubmission(999)).toBeNull();
  });

  it("lists by status, newest first, a page at a time", async () => {
    const ids: number[] = [];
    for (let n = 0; n < SUBMISSIONS_PAGE_SIZE + 2; n++) {
      ids.push((await submit(`s${n}@example.test`)).id);
    }
    const first = await listPlayerSubmissions({ status: "new" });
    expect(first.hasMore).toBe(true);
    expect(first.submissions).toHaveLength(SUBMISSIONS_PAGE_SIZE);
    expect(first.submissions[0]!.id).toBe(ids.at(-1));
    const rest = await listPlayerSubmissions({
      status: "new",
      beforeId: first.submissions.at(-1)!.id,
    });
    expect(rest.hasMore).toBe(false);
    expect(rest.submissions.map((row) => row.id)).toEqual([ids[1], ids[0]]);
    expect(
      (await listPlayerSubmissions({ status: "spam" })).submissions,
    ).toEqual([]);
  });

  it("records who reviewed it and the player it was entered for", async () => {
    await createUser({ id: "u1", firstName: "James", lastName: "Singleton" });
    const player = await createPortalPlayer({
      firstName: "Test",
      lastName: "Player",
    });
    const { id } = await submit();
    expect(
      await reviewPlayerSubmission({
        id,
        status: "accepted",
        matchedPlayerId: player.id,
        reviewerUserId: "u1",
      }),
    ).toBe(true);
    const { submissions } = await listPlayerSubmissions({ status: "accepted" });
    expect(submissions[0]).toMatchObject({
      status: "accepted",
      matchedPlayerId: player.id,
      reviewer: "James Singleton",
    });
    expect(submissions[0]!.reviewedAt).toBeInstanceOf(Date);
    expect(await countNewPlayerSubmissions()).toBe(0);
    expect(await reviewPlayerSubmission({ id: 999, status: "spam" })).toBe(
      false,
    );
  });

  it("keeps an unreadable payload in the inbox instead of failing", async () => {
    const { id } = await submit();
    await db.update(playerSubmissionsTable).set({ payload: { v: 99 } });
    expect((await getPlayerSubmission(id))!.payload).toBeNull();
    // No reviewer: the name is null, not an empty string.
    await reviewPlayerSubmission({
      id,
      status: "rejected",
      reviewNote: "junk",
    });
    const { submissions } = await listPlayerSubmissions({ status: "rejected" });
    expect(submissions[0]).toMatchObject({
      reviewer: null,
      reviewNote: "junk",
    });
  });
});
