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
    recordRecruitmentEvents: vi.fn(),
    matchEspnIds: vi.fn(),
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
const { mockFetchAthlete } = vi.hoisted(() => ({ mockFetchAthlete: vi.fn() }));
vi.mock("@redshirt-sports/clients/espn", async (importActual) => ({
  ...(await importActual<typeof import("@redshirt-sports/clients/espn")>()),
  fetchEspnAthlete: mockFetchAthlete,
}));
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
  prefillFromEspn,
  pushPortalToSite,
  recordPortalMove,
  recordPortalMoves,
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
      db.findSimilarPlayers.mockResolvedValue([]);
      await findPortalDuplicates("x".repeat(500));
      expect(db.findSimilarPlayers).toHaveBeenCalledWith("x".repeat(200), {
        limit: 20,
      });
      await findPortalSchools("y".repeat(200));
      expect(db.searchPortalSchools).toHaveBeenCalledWith("y".repeat(80));
    });
  });

  describe("intake helpers", () => {
    const similar = (id: number, similarity: number, extra = {}) => ({
      id,
      similarity,
      sportIds: ["sport-football"],
      currentSchoolIds: ["school-montana"],
      hsGradYear: 2022,
      ...extra,
    });

    it("tiers duplicates with what the form knows", async () => {
      db.findSimilarPlayers.mockResolvedValue([
        similar(1, 0.55),
        similar(2, 0.9),
        similar(3, 0.32, { sportIds: ["sport-mbb"] }),
      ]);
      const found = await findPortalDuplicates("Jalen Brooks", {
        sportId: "sport-football",
        schoolId: "school-montana",
        hsGradYear: "",
      });
      expect(found.map((row) => [row.id, row.tier])).toEqual([
        [2, "likely"],
        [1, "likely"],
      ]);
      // Without context, a looser name is only possible.
      const bare = await findPortalDuplicates("Jalen Brooks", "junk");
      expect(bare.map((row) => [row.id, row.tier])).toEqual([
        [2, "likely"],
        [1, "possible"],
      ]);
    });

    it("prefills from an ESPN link, with our school and any player on file", async () => {
      expect(await prefillFromEspn("https://example.com/x")).toMatchObject({
        ok: false,
      });
      mockFetchAthlete.mockResolvedValue({
        id: "5225414",
        firstName: "Ty",
        lastName: "Pennington",
        displayHeight: "6' 2\"",
        displayWeight: "220 lbs",
        displayExperience: "Senior",
        position: { abbreviation: "QB" },
        team: { id: "2464", displayName: "Northern Arizona Lumberjacks" },
      });
      db.matchEspnIds.mockResolvedValue({
        existingPlayer: {
          id: 7,
          firstName: "Ty",
          lastName: "Pennington",
          mergedIntoId: 9,
        },
        school: { id: "school-nau", name: "Northern Arizona" },
      });
      const result = await prefillFromEspn(
        "https://www.espn.com/college-football/player/_/id/5225414/ty-pennington",
      );
      expect(mockFetchAthlete).toHaveBeenCalledWith("football", "5225414");
      expect(db.matchEspnIds).toHaveBeenCalledWith({
        espnPlayerId: "5225414",
        espnTeamId: "2464",
      });
      expect(result).toMatchObject({
        ok: true,
        sportSlug: "football",
        school: { id: "school-nau" },
        // A merged player points at the survivor.
        existingPlayer: { id: 9 },
        profile: { heightIn: 74, weightLb: 220, classCode: "SR" },
      });
      mockFetchAthlete.mockRejectedValue(new Error("404"));
      expect(
        await prefillFromEspn(
          "https://www.espn.com/college-football/player/_/id/1",
        ),
      ).toMatchObject({ ok: false, message: expect.stringContaining("ESPN") });
    });

    it("records the ESPN id on a new player, and refuses one already on file", async () => {
      db.createPortalPlayer.mockResolvedValue({ id: 100002, slug: "ty" });
      db.matchEspnIds.mockResolvedValue({ existingPlayer: null, school: null });
      expect(
        (
          await createPortalPlayerAction({
            bio,
            entry: null,
            espnId: "5225414",
          })
        ).ok,
      ).toBe(true);
      expect(db.addPlayerExternalId).toHaveBeenCalledWith({
        playerId: 100002,
        provider: "espn",
        externalId: "5225414",
        actorUserId: "user_admin",
      });

      vi.clearAllMocks();
      db.matchEspnIds.mockResolvedValue({
        existingPlayer: {
          id: 7,
          firstName: "Ty",
          lastName: "Pennington",
          mergedIntoId: null,
        },
        school: null,
      });
      const refused = await createPortalPlayerAction({
        bio,
        entry: null,
        espnId: "5225414",
      });
      expect(refused).toMatchObject({
        ok: false,
        message: expect.stringContaining("#7"),
      });
      expect(db.createPortalPlayer).not.toHaveBeenCalled();
      expect(
        (await createPortalPlayerAction({ bio, entry: null, espnId: "abc" }))
          .ok,
      ).toBe(false);
    });

    it("records several moves in one save", async () => {
      const move = (schoolId: string) => ({
        recruitmentId: 7,
        type: "offered",
        occurredAt: "2026-11-05T17:00:00.000Z",
        school: { schoolId, schoolName: "" },
      });
      const result = await recordPortalMoves({
        playerId: 1,
        moves: [move("school-idaho"), move("school-montana")],
      });
      expect(result).toMatchObject({ ok: true, message: "Saved 2 moves." });
      expect(db.recordRecruitmentEvents).toHaveBeenCalledWith([
        expect.objectContaining({
          school: expect.objectContaining({ schoolId: "school-idaho" }),
          actorUserId: "user_admin",
        }),
        expect.objectContaining({
          school: expect.objectContaining({ schoolId: "school-montana" }),
        }),
      ]);
      expect((await recordPortalMoves({ playerId: 1, moves: [] })).ok).toBe(
        false,
      );
      db.recordRecruitmentEvents.mockRejectedValueOnce(
        new db.PortalWriteError(
          "invalid_transition",
          "Already offered by Idaho.",
        ),
      );
      expect(
        (
          await recordPortalMoves({
            playerId: 1,
            moves: [move("school-idaho")],
          })
        ).message,
      ).toBe("Already offered by Idaho.");
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

    it("records visits and contact, and never a story link", async () => {
      // Articles reach the player page through Studio tags, not the desk.
      const move = {
        recruitmentId: 7,
        type: "visited",
        occurredAt: "2026-11-05T17:00:00.000Z",
        school: { schoolId: "school-idaho", schoolName: "" },
        storySlug: "portal-qb-visits-idaho",
      };
      expect((await recordPortalMove({ playerId: 1, move })).ok).toBe(true);
      expect(db.recordRecruitmentEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: "visited" }),
      );
      expect(db.recordRecruitmentEvent).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ storySlug: expect.anything() }),
      );
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
