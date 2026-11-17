import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  class PortalWriteError extends Error {
    constructor(
      readonly code: string,
      message: string,
    ) {
      super(message);
    }
  }
  return {
    PortalWriteError,
    addPlayerExternalId: vi.fn(),
    listPlayerExternalIds: vi.fn(),
    removePlayerExternalId: vi.fn(),
    previewMergeIdConflicts: vi.fn(),
    createPortalPlayer: vi.fn(),
    dismissDuplicate: vi.fn(),
    listDuplicateCandidates: vi.fn(),
    mergePlayers: vi.fn(),
    previewMerge: vi.fn(),
    expirePendingPortalPushes: vi.fn(),
    findSimilarPlayers: vi.fn(),
    getPlayerSubmission: vi.fn(),
    listPlayerSubmissions: vi.fn(),
    reviewPlayerSubmission: vi.fn(),
    getPortalPendingSummary: vi.fn(),
    getPortalPlayer: vi.fn(),
    listPortalPlayers: vi.fn(),
    listPortalSports: vi.fn(),
    openRecruitment: vi.fn(),
    pushPortal: vi.fn(),
    recordRecruitmentEvent: vi.fn(),
    resolvePortalActor: vi.fn(),
    searchPortalSchools: vi.fn(),
    updatePlayerBio: vi.fn(),
    updatePlayerSport: vi.fn(),
    voidRecruitmentEvent: vi.fn(),
  };
});
const { mockCapture, mockMessage, mockExpireWeb, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockCapture: vi.fn(),
    mockMessage: vi.fn(),
    mockExpireWeb: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }));

vi.mock("@redshirt-sports/db/queries", () => db);
vi.mock("@redshirt-sports/auth/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_admin" }),
}));
vi.mock("@/lib/access", () => ({
  requireArea: vi.fn(async () => ({
    userId: "user_admin",
    roles: ["admin"],
    areas: new Set(["admin", "portal", "ballots"]),
  })),
}));
vi.mock("@/lib/revalidate-web-portal", () => ({
  expireWebPortalTags: mockExpireWeb,
}));
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@sentry/nextjs", () => ({
  captureException: mockCapture,
  captureMessage: mockMessage,
}));

import {
  addPlayerExternalIdAction,
  createPortalPlayerAction,
  dismissPortalDuplicate,
  enterPortal,
  findPortalDuplicates,
  findPortalSchools,
  getDuplicateQueue,
  getMergeComparison,
  getPortalDesk,
  getPortalPlayerPage,
  getSubmissionForEntry,
  getSubmissionInbox,
  mergePortalPlayers,
  pushPortalToSite,
  recordPortalMove,
  removePlayerExternalIdAction,
  reviewSubmission,
  savePlayerBio,
  savePlayerSport,
  voidPortalMove,
} from "@/actions/portal";

const bio = { firstName: " Jalen ", lastName: "Brooks", suffix: "" };
const entry = {
  sportId: "sport-football",
  cycleYear: "2027",
  origin: { schoolId: "school-montana", schoolName: null },
  enteredAt: "2026-11-02T17:00:00.000Z",
  classAtEntry: "RS-SO",
  eligibilityYears: "",
  isGradTransfer: false,
  attributes: { position: "QB", heightIn: "74", weightLb: "" },
  sourceType: "social",
  sourceUrl: "",
  sourceNote: "",
};

describe("portal admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.resolvePortalActor.mockResolvedValue("user_admin");
    db.expirePendingPortalPushes.mockResolvedValue({ expired: 0, failed: [] });
  });

  describe("reads", () => {
    it("loads the desk", async () => {
      db.listPortalSports.mockResolvedValue([{ id: "s" }]);
      db.getPortalPendingSummary.mockResolvedValue({ players: 1 });
      db.listPortalPlayers.mockResolvedValue([]);
      expect(await getPortalDesk({ pendingOnly: true, beforeId: 9 })).toEqual({
        sports: [{ id: "s" }],
        pending: { players: 1 },
        players: [],
      });
      expect(db.listPortalPlayers).toHaveBeenCalledWith({
        pendingOnly: true,
        beforeId: 9,
      });
    });

    it("returns null for an unknown player", async () => {
      db.getPortalPlayer.mockResolvedValue(null);
      expect(await getPortalPlayerPage(1)).toBeNull();
      db.getPortalPlayer.mockResolvedValue({ id: 1 });
      db.listPlayerExternalIds.mockResolvedValue([{ id: 3 }]);
      expect(await getPortalPlayerPage(1)).toMatchObject({
        player: { id: 1 },
        externalIds: [{ id: 3 }],
      });
    });

    it("caps search input", async () => {
      await findPortalDuplicates("x".repeat(500));
      expect(db.findSimilarPlayers).toHaveBeenCalledWith("x".repeat(200));
      await findPortalSchools("y".repeat(200));
      expect(db.searchPortalSchools).toHaveBeenCalledWith("y".repeat(80));
    });
  });

  describe("createPortalPlayerAction", () => {
    it("creates a player with their entry, parsed", async () => {
      db.createPortalPlayer.mockResolvedValue({
        id: 100001,
        slug: "jalen-brooks",
      });
      const result = await createPortalPlayerAction({ bio, entry });
      expect(result).toEqual({
        ok: true,
        message: "Player saved.",
        playerId: 100001,
      });
      const call = db.createPortalPlayer.mock.calls[0]![0];
      expect(call).toMatchObject({
        firstName: "Jalen",
        suffix: null,
        actorUserId: "user_admin",
        entry: {
          cycleYear: 2027,
          eligibilityYears: null,
          attributes: { position: "QB", heightIn: 74, weightLb: null },
          sourceType: "social",
          sourceUrl: null,
        },
      });
      expect(call.entry.enteredAt).toBeInstanceOf(Date);
      expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/players/100001");
    });

    it("passes on the similar players confirmed as different people", async () => {
      db.createPortalPlayer.mockResolvedValue({ id: 6, slug: "a" });
      await createPortalPlayerAction({
        bio,
        entry: null,
        notDuplicateOf: [100000, "100001"],
      });
      expect(db.createPortalPlayer.mock.calls[0]![0].notDuplicateOf).toEqual([
        100000, 100001,
      ]);
      expect(
        (
          await createPortalPlayerAction({
            bio,
            entry: null,
            notDuplicateOf: ["nope"],
          })
        ).ok,
      ).toBe(false);
    });

    it("creates a player without an entry", async () => {
      db.createPortalPlayer.mockResolvedValue({ id: 5, slug: "a" });
      await createPortalPlayerAction({ bio, entry: null });
      expect(db.createPortalPlayer.mock.calls[0]![0]).toMatchObject({
        entry: null,
        notDuplicateOf: [],
      });
    });

    it("refuses a blank name", async () => {
      const result = await createPortalPlayerAction({
        bio: { firstName: " ", lastName: "B" },
        entry: null,
      });
      expect(result).toEqual({ ok: false, message: "firstName: Required." });
      expect(db.createPortalPlayer).not.toHaveBeenCalled();
    });

    it("refuses an entry without a school, a bad link, or a future date", async () => {
      const cases = [
        { origin: { schoolId: null, schoolName: "" } },
        { sourceUrl: "http://example.com" },
        { enteredAt: "2999-01-01T00:00:00.000Z" },
        { attributes: { heightIn: "30" } },
      ];
      for (const patch of cases) {
        const result = await createPortalPlayerAction({
          bio,
          entry: { ...entry, ...patch },
        });
        expect(result.ok).toBe(false);
      }
      expect(db.createPortalPlayer).not.toHaveBeenCalled();
    });

    it("explains a refused write", async () => {
      db.createPortalPlayer.mockRejectedValueOnce(
        new db.PortalWriteError(
          "invalid_position",
          "PG is not a football position.",
        ),
      );
      expect(await createPortalPlayerAction({ bio, entry })).toEqual({
        ok: false,
        message: "PG is not a football position.",
      });
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("explains a unique violation and reports anything else", async () => {
      db.createPortalPlayer.mockRejectedValueOnce(
        Object.assign(new Error("dup"), { cause: { code: "23505" } }),
      );
      expect((await createPortalPlayerAction({ bio, entry })).message).toMatch(
        /already exists/,
      );
      db.createPortalPlayer.mockRejectedValueOnce(new Error("boom"));
      expect((await createPortalPlayerAction({ bio, entry })).message).toMatch(
        /reported/,
      );
      expect(mockCapture).toHaveBeenCalledTimes(1);
    });
  });

  describe("moves", () => {
    it("enters the portal for an existing player", async () => {
      const result = await enterPortal({ playerId: "100001", entry });
      expect(result.ok).toBe(true);
      expect(db.openRecruitment).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 100001,
          actorUserId: "user_admin",
        }),
      );
      expect((await enterPortal({ playerId: "x", entry })).ok).toBe(false);
      expect((await enterPortal({ playerId: 1, entry: {} })).ok).toBe(false);
    });

    it("records a move and refuses 'entered' as a move", async () => {
      const move = {
        recruitmentId: 7,
        type: "committed",
        occurredAt: "2026-11-05T17:00:00.000Z",
        school: { schoolId: "school-boise", schoolName: "" },
      };
      expect((await recordPortalMove({ playerId: 1, move })).ok).toBe(true);
      expect(db.recordRecruitmentEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          recruitmentId: 7,
          type: "committed",
          school: { schoolId: "school-boise", schoolName: null },
        }),
      );
      expect(
        (
          await recordPortalMove({
            playerId: 1,
            move: { ...move, type: "entered" },
          })
        ).ok,
      ).toBe(false);
      expect((await recordPortalMove({ playerId: 0, move })).ok).toBe(false);
      db.recordRecruitmentEvent.mockRejectedValueOnce(
        new db.PortalWriteError(
          "invalid_transition",
          "Can't sign before committing.",
        ),
      );
      expect((await recordPortalMove({ playerId: 1, move })).message).toBe(
        "Can't sign before committing.",
      );
    });

    it("records visits and contact, with a public story link", async () => {
      const move = {
        recruitmentId: 7,
        type: "visited",
        occurredAt: "2026-11-05T17:00:00.000Z",
        school: { schoolId: "school-idaho", schoolName: "" },
        storySlug: " https://www.redshirtsports.com/portal-qb-visits-idaho/ ",
      };
      expect((await recordPortalMove({ playerId: 1, move })).ok).toBe(true);
      expect(db.recordRecruitmentEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "visited",
          storySlug: "portal-qb-visits-idaho",
        }),
      );
      // Blank means no story.
      await recordPortalMove({ playerId: 1, move: { ...move, storySlug: "" } });
      expect(db.recordRecruitmentEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({ storySlug: null }),
      );
      const bad = await recordPortalMove({
        playerId: 1,
        move: { ...move, storySlug: "Some Story Title" },
      });
      expect(bad).toMatchObject({
        ok: false,
        message: expect.stringContaining("Paste the article's link"),
      });
    });

    it("dates only a scheduled visit ahead, and not past a year", async () => {
      const day = 86_400_000;
      const at = (days: number) =>
        new Date(Date.now() + days * day).toISOString();
      const move = (type: string, occurredAt: string) => ({
        recruitmentId: 7,
        type,
        occurredAt,
        school: { schoolId: "school-idaho", schoolName: "" },
      });
      const save = (type: string, days: number) =>
        recordPortalMove({ playerId: 1, move: move(type, at(days)) });
      expect((await save("visit_scheduled", 30)).ok).toBe(true);
      expect(await save("visit_scheduled", 400)).toMatchObject({
        ok: false,
        message: "occurredAt: That visit is more than a year away.",
      });
      expect(await save("visited", 30)).toMatchObject({
        ok: false,
        message: "occurredAt: That date is in the future.",
      });
    });

    it("undoes a move with an optional reason", async () => {
      expect(
        (await voidPortalMove({ playerId: 1, eventId: "12", reason: " typo " }))
          .ok,
      ).toBe(true);
      expect(db.voidRecruitmentEvent).toHaveBeenCalledWith({
        eventId: 12,
        reason: "typo",
        actorUserId: "user_admin",
      });
      expect(
        (await voidPortalMove({ playerId: "a", eventId: 1, reason: "" })).ok,
      ).toBe(false);
      expect(
        (await voidPortalMove({ playerId: 1, eventId: -1, reason: "" })).ok,
      ).toBe(false);
      expect(
        (
          await voidPortalMove({
            playerId: 1,
            eventId: 1,
            reason: "x".repeat(300),
          })
        ).ok,
      ).toBe(false);
      db.voidRecruitmentEvent.mockRejectedValueOnce(new Error("boom"));
      expect(
        (await voidPortalMove({ playerId: 1, eventId: 1, reason: "" })).ok,
      ).toBe(false);
    });

    it("saves bio and sport attributes", async () => {
      expect((await savePlayerBio({ playerId: 1, bio })).ok).toBe(true);
      expect((await savePlayerBio({ playerId: "z", bio })).ok).toBe(false);
      expect((await savePlayerBio({ playerId: 1, bio: {} })).ok).toBe(false);
      db.updatePlayerBio.mockRejectedValueOnce(new Error("boom"));
      expect((await savePlayerBio({ playerId: 1, bio })).ok).toBe(false);

      const sport = {
        playerId: 1,
        sportId: "sport-football",
        attributes: { position: "WR", heightIn: "", weightLb: "190" },
      };
      expect((await savePlayerSport(sport)).ok).toBe(true);
      expect(db.updatePlayerSport).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: { position: "WR", heightIn: null, weightLb: 190 },
        }),
      );
      expect((await savePlayerSport({ ...sport, playerId: "z" })).ok).toBe(
        false,
      );
      expect((await savePlayerSport({ ...sport, sportId: "" })).ok).toBe(false);
      expect(
        (await savePlayerSport({ ...sport, attributes: { weightLb: "9000" } }))
          .ok,
      ).toBe(false);
      db.updatePlayerSport.mockRejectedValueOnce(new Error("boom"));
      expect((await savePlayerSport(sport)).ok).toBe(false);
    });
  });

  describe("public ids", () => {
    it("adds an id from a pasted link or number", async () => {
      expect(
        (
          await addPlayerExternalIdAction({
            playerId: "4",
            provider: "espn",
            value:
              "https://www.espn.com/college-football/player/_/id/4432577/x",
          })
        ).ok,
      ).toBe(true);
      expect(db.addPlayerExternalId).toHaveBeenCalledWith({
        playerId: 4,
        provider: "espn",
        externalId: "4432577",
        actorUserId: "user_admin",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/players/4");
      expect(
        (
          await addPlayerExternalIdAction({
            playerId: 4,
            provider: "ncaa",
            value: " 7612345 ",
          })
        ).ok,
      ).toBe(true);
    });

    it("explains what to paste when it can't find an id", async () => {
      for (const provider of ["espn", "ncaa"]) {
        const result = await addPlayerExternalIdAction({
          playerId: 4,
          provider,
          value: "NCAA ID 2601808637x",
        });
        expect(result.ok).toBe(false);
        expect(result.message).toContain(
          provider === "espn" ? "espn.com" : "stats.ncaa.org",
        );
      }
      expect(
        (
          await addPlayerExternalIdAction({
            playerId: 4,
            provider: "eligibility",
            value: "1",
          })
        ).ok,
      ).toBe(false);
      expect(
        (
          await addPlayerExternalIdAction({
            playerId: "z",
            provider: "espn",
            value: "1",
          })
        ).ok,
      ).toBe(false);
      expect(db.addPlayerExternalId).not.toHaveBeenCalled();
    });

    it("passes on a refused id", async () => {
      db.addPlayerExternalId.mockRejectedValueOnce(
        new db.PortalWriteError("external_id_taken", "Someone has it."),
      );
      expect(
        await addPlayerExternalIdAction({
          playerId: 4,
          provider: "espn",
          value: "1",
        }),
      ).toEqual({ ok: false, message: "Someone has it." });
    });

    it("removes an id", async () => {
      expect(
        (await removePlayerExternalIdAction({ playerId: 4, id: "7" })).ok,
      ).toBe(true);
      expect(db.removePlayerExternalId).toHaveBeenCalledWith({
        playerId: 4,
        id: 7,
        actorUserId: "user_admin",
      });
      expect(
        (await removePlayerExternalIdAction({ playerId: "z", id: 7 })).ok,
      ).toBe(false);
      expect(
        (await removePlayerExternalIdAction({ playerId: 4, id: 0 })).ok,
      ).toBe(false);
      db.removePlayerExternalId.mockRejectedValueOnce(new Error("boom"));
      expect(
        (await removePlayerExternalIdAction({ playerId: 4, id: 7 })).ok,
      ).toBe(false);
    });
  });

  describe("pushPortalToSite", () => {
    it("publishes and refreshes the site", async () => {
      db.pushPortal.mockResolvedValue({
        pushId: 3,
        playerCount: 2,
        tags: ["t"],
      });
      expect(await pushPortalToSite()).toEqual({
        ok: true,
        message: "Published 2 players.",
      });
      expect(db.pushPortal).toHaveBeenCalledWith({
        trigger: "admin",
        actorUserId: "user_admin",
      });
      expect(db.expirePendingPortalPushes).toHaveBeenCalledWith(mockExpireWeb);
    });

    it("says when nothing was waiting, and uses the singular", async () => {
      db.pushPortal.mockResolvedValueOnce(null);
      expect((await pushPortalToSite()).message).toBe(
        "Nothing was waiting to publish.",
      );
      db.pushPortal.mockResolvedValueOnce({
        pushId: 4,
        playerCount: 1,
        tags: [],
      });
      expect((await pushPortalToSite()).message).toBe("Published 1 player.");
    });

    it("counts a failed refresh as pushed, and says the job will retry", async () => {
      db.pushPortal.mockResolvedValue({
        pushId: 3,
        playerCount: 2,
        tags: ["t"],
      });
      db.expirePendingPortalPushes.mockResolvedValue({
        expired: 0,
        failed: [{ pushId: 3, error: "Site cache refresh failed (500)" }],
      });
      const result = await pushPortalToSite();
      expect(result.ok).toBe(true);
      expect(result.message).toMatch(/tonight's job will retry/);
      expect(mockMessage).toHaveBeenCalledWith(
        "Portal push 3 cache expiry failed: Site cache refresh failed (500)",
        "warning",
      );
    });

    it("reports a failed push without refreshing", async () => {
      db.pushPortal.mockRejectedValue(new Error("lock timeout"));
      const result = await pushPortalToSite();
      expect(result.ok).toBe(false);
      expect(mockCapture).toHaveBeenCalled();
      expect(db.expirePendingPortalPushes).not.toHaveBeenCalled();
    });
  });

  describe("duplicates", () => {
    it("pairs each candidate with both players' cards", async () => {
      db.listDuplicateCandidates.mockResolvedValue([
        { playerAId: 1, playerBId: 2, score: 0.8 },
        { playerAId: 1, playerBId: 3, score: 0.7 },
      ]);
      db.listPortalPlayers.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      expect(await getDuplicateQueue()).toEqual([
        { playerAId: 1, playerBId: 2, score: 0.8, a: { id: 1 }, b: { id: 2 } },
      ]);
      expect(db.listPortalPlayers).toHaveBeenCalledWith({
        ids: [1, 2, 3],
        limit: 3,
      });
    });

    it("compares two players with both merge previews", async () => {
      db.getPortalPlayer.mockImplementation(async (id: number) =>
        id === 9 ? null : { id },
      );
      db.previewMerge.mockImplementation(async (keep: number) => [{ keep }]);
      db.previewMergeIdConflicts.mockResolvedValue([{ provider: "espn" }]);
      expect(await getMergeComparison(1, 2)).toEqual({
        a: { id: 1 },
        b: { id: 2 },
        keepA: [{ keep: 1 }],
        keepB: [{ keep: 2 }],
        idConflicts: [{ provider: "espn" }],
      });
      expect(await getMergeComparison(1, 9)).toBeNull();
      expect(await getMergeComparison(1, 1)).toBeNull();
    });

    it("dismisses a pair", async () => {
      expect((await dismissPortalDuplicate({ playerIds: [2, "1"] })).ok).toBe(
        true,
      );
      expect(db.dismissDuplicate).toHaveBeenCalledWith({
        playerIds: [2, 1],
        actorUserId: "user_admin",
      });
      expect((await dismissPortalDuplicate({ playerIds: [1, 1] })).ok).toBe(
        false,
      );
      expect((await dismissPortalDuplicate({ playerIds: "x" })).ok).toBe(false);
      db.dismissDuplicate.mockRejectedValueOnce(new Error("boom"));
      expect((await dismissPortalDuplicate({ playerIds: [1, 2] })).ok).toBe(
        false,
      );
    });

    it("merges and explains a refusal", async () => {
      const result = await mergePortalPlayers({ survivorId: 1, loserId: "2" });
      expect(result).toMatchObject({ ok: true, playerId: 1 });
      expect(db.mergePlayers).toHaveBeenCalledWith({
        survivorId: 1,
        loserId: 2,
        actorUserId: "user_admin",
      });
      expect((await mergePortalPlayers({ survivorId: 1, loserId: 1 })).ok).toBe(
        false,
      );
      db.mergePlayers.mockRejectedValueOnce(
        new db.PortalWriteError("player_merged", "Player was merged into 3."),
      );
      expect(
        (await mergePortalPlayers({ survivorId: 1, loserId: 2 })).message,
      ).toBe("Player was merged into 3.");
    });
  });

  describe("public submissions", () => {
    it("lists one status at a time, defaulting to new", async () => {
      db.listPlayerSubmissions.mockResolvedValue({
        submissions: [],
        hasMore: false,
      });
      expect(await getSubmissionInbox({})).toEqual({
        status: "new",
        submissions: [],
        hasMore: false,
      });
      expect(db.listPlayerSubmissions).toHaveBeenLastCalledWith({
        status: "new",
        beforeId: undefined,
      });
      await getSubmissionInbox({ status: "spam", beforeId: "40" });
      expect(db.listPlayerSubmissions).toHaveBeenLastCalledWith({
        status: "spam",
        beforeId: 40,
      });
      // Junk in the URL falls back, not errors.
      await getSubmissionInbox({ status: "nope", beforeId: "x" });
      expect(db.listPlayerSubmissions).toHaveBeenLastCalledWith({
        status: "new",
        beforeId: undefined,
      });
    });

    it("loads a submission for the entry form", async () => {
      db.getPlayerSubmission.mockResolvedValue({ id: 7 });
      expect(await getSubmissionForEntry("7")).toEqual({ id: 7 });
      expect(db.getPlayerSubmission).toHaveBeenCalledWith(7);
      expect(await getSubmissionForEntry("junk")).toBeNull();
    });

    it("closes a submission as accepted, rejected, or spam", async () => {
      db.reviewPlayerSubmission.mockResolvedValue(true);
      expect(
        await reviewSubmission({
          id: 7,
          status: "rejected",
          reviewNote: " no ",
        }),
      ).toEqual({ ok: true, message: "Saved." });
      expect(db.reviewPlayerSubmission).toHaveBeenCalledWith({
        id: 7,
        status: "rejected",
        reviewNote: "no",
        reviewerUserId: "user_admin",
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/portal/submissions");
      // It can't be reopened as new, and it has to exist.
      expect((await reviewSubmission({ id: 7, status: "new" })).ok).toBe(false);
      db.reviewPlayerSubmission.mockResolvedValueOnce(false);
      expect(await reviewSubmission({ id: 9, status: "spam" })).toEqual({
        ok: false,
        message: "Submission not found.",
      });
      db.reviewPlayerSubmission.mockRejectedValueOnce(new Error("db down"));
      expect((await reviewSubmission({ id: 9, status: "spam" })).ok).toBe(
        false,
      );
    });

    it("marks the submission accepted when its player is saved", async () => {
      db.createPortalPlayer.mockResolvedValue({ id: 100050 });
      const result = await createPortalPlayerAction({
        bio,
        entry,
        submissionId: 7,
      });
      expect(result).toMatchObject({ ok: true, playerId: 100050 });
      expect(db.reviewPlayerSubmission).toHaveBeenCalledWith({
        id: 7,
        status: "accepted",
        matchedPlayerId: 100050,
        reviewerUserId: "user_admin",
      });
      // No submission, no review; a bad id is refused before anything saves.
      db.reviewPlayerSubmission.mockClear();
      await createPortalPlayerAction({ bio, entry });
      expect(db.reviewPlayerSubmission).not.toHaveBeenCalled();
      db.createPortalPlayer.mockClear();
      expect(
        (await createPortalPlayerAction({ bio, entry, submissionId: "x" })).ok,
      ).toBe(false);
      expect(db.createPortalPlayer).not.toHaveBeenCalled();
    });
  });
});
