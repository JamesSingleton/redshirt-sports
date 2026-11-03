import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { BRACKET_FORMAT_SEEDS } from "../src/playoff-bracket/spec";
import { buildBracketView } from "../src/playoff-bracket/view";
import {
  BracketInputError,
  createBracketEdition,
  deleteDraftBracketEdition,
  findBracketFormat,
  getBracketEdition,
  getBracketTeamStats,
  getPublishedBracketEditions,
  setBracketEditionStatus,
  setBracketGame,
  setBracketSlot,
} from "../src/queries/brackets";
import {
  bracketEditionsTable,
  bracketFormatsTable,
  bracketGamesTable,
  bracketSlotsTable,
  gamesTable,
  pollRankingsTable,
  SEASON_TYPE_CODES,
  seasonsTable,
} from "../src/schema";
import {
  createPollWeekFixture,
  db,
  FIXTURE_YEAR,
  type PollWeekFixture,
  resetDatabase,
} from "./fixtures";

const FCS = BRACKET_FORMAT_SEEDS.find(
  (row) => row.key === "fcs-24-seed16-v2024",
)!;

let fixture: PollWeekFixture;
let formatId: string;
let seasonId: string;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createPollWeekFixture({ weekCount: 3 });
  const [format] = await db
    .insert(bracketFormatsTable)
    .values({
      sportId: fixture.sportId,
      divisionSlug: "fcs",
      key: FCS.key,
      effectiveFromYear: FCS.effectiveFromYear,
      effectiveToYear: FCS.effectiveToYear,
      spec: FCS.spec,
    })
    .returning();
  formatId = format!.id;
  const [season] = await db
    .select({ id: seasonsTable.id })
    .from(seasonsTable)
    .where(eq(seasonsTable.sportId, fixture.sportId));
  seasonId = season!.id;
});

function projection(weekIndex: number, copySlotsFrom?: string) {
  return createBracketEdition({
    formatId,
    seasonId,
    kind: "projection",
    weekId: fixture.weekIds[weekIndex]!,
    copySlotsFrom,
  });
}

async function fillField(editionId: string, count = 24) {
  for (let seed = 1; seed <= count; seed += 1) {
    await setBracketSlot({
      editionId,
      slotKey: `seed-${seed}`,
      schoolId: fixture.schoolIds[seed - 1]!,
      bidType: "at-large",
      bidLabel: null,
    });
  }
}

describe("bracket editions", () => {
  it("finds the format for the sport, division and year", async () => {
    const format = await findBracketFormat({
      sportSlug: fixture.sportSlug,
      divisionSlug: "fcs",
      year: FIXTURE_YEAR,
    });
    expect(format?.id).toBe(formatId);
    expect(format?.spec.fieldSize).toBe(24);
    await expect(
      findBracketFormat({
        sportSlug: fixture.sportSlug,
        divisionSlug: "fcs",
        year: 2023,
      }),
    ).resolves.toBeNull();
  });

  it("allows one projection per week and one official bracket per season", async () => {
    await projection(0);
    await expect(projection(0)).rejects.toThrow(BracketInputError);
    await expect(projection(1)).resolves.toBeTypeOf("string");

    const official = () =>
      createBracketEdition({
        formatId,
        seasonId,
        kind: "official",
        weekId: null,
      });
    await official();
    await expect(official()).rejects.toThrow(
      "This season already has an official bracket",
    );
  });

  it("rejects an official bracket with a week at the database too", async () => {
    await expect(
      db.insert(bracketEditionsTable).values({
        formatId,
        seasonId,
        kind: "official",
        status: "draft",
        weekId: fixture.weekIds[0]!,
      }),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        constraint_name: "bracket_editions_week_check",
      }),
    });
  });

  it("copies last week's field into a new projection", async () => {
    const week1 = await projection(0);
    await fillField(week1);
    const week2 = await projection(1, week1);

    const detail = await getBracketEdition(week2);
    expect(detail?.slots).toHaveLength(24);
    expect(detail?.edition.weekNumber).toBe(2);
    const seedOne = detail?.slots.find((slot) => slot.slotKey === "seed-1");
    expect(seedOne?.team.schoolId).toBe(fixture.schoolIds[0]);
  });

  it("swaps two schools when one is placed in the other's slot", async () => {
    const edition = await projection(0);
    await fillField(edition, 2);
    const result = await setBracketSlot({
      editionId: edition,
      slotKey: "seed-1",
      schoolId: fixture.schoolIds[1]!,
      bidType: "auto",
      bidLabel: "Big Sky",
    });
    expect(result.swappedWith).toBe("seed-2");

    const slots = await db
      .select()
      .from(bracketSlotsTable)
      .where(eq(bracketSlotsTable.editionId, edition));
    const bySlot = new Map(slots.map((slot) => [slot.slotKey, slot]));
    expect(bySlot.get("seed-1")?.schoolId).toBe(fixture.schoolIds[1]);
    expect(bySlot.get("seed-1")?.bidLabel).toBe("Big Sky");
    expect(bySlot.get("seed-2")?.schoolId).toBe(fixture.schoolIds[0]);
  });

  it("rejects slot and game keys the format does not have", async () => {
    const edition = await projection(0);
    await expect(
      setBracketSlot({
        editionId: edition,
        slotKey: "seed-25",
        schoolId: fixture.schoolIds[0]!,
        bidType: null,
        bidLabel: null,
      }),
    ).rejects.toThrow("Unknown slot seed-25");
    await expect(
      setBracketGame({
        editionId: edition,
        gameKey: "r1-1",
        homeSide: null,
        siteLabel: null,
        kickoffAt: null,
        sideAScore: null,
        sideBScore: null,
      }),
    ).rejects.toThrow("Unknown game r1-1");
  });

  it("finalizes a scored game, moves the winner on, and clears an emptied game", async () => {
    const edition = await projection(0);
    await fillField(edition);
    await setBracketGame({
      editionId: edition,
      gameKey: "r1-16",
      homeSide: null,
      siteLabel: "Bobcat Stadium",
      kickoffAt: null,
      sideAScore: 14,
      sideBScore: 17,
    });

    const detail = await getBracketEdition(edition);
    expect(detail?.games).toEqual([
      expect.objectContaining({
        gameKey: "r1-16",
        status: "final",
        winnerSide: "b",
      }),
    ]);
    const view = buildBracketView(detail!.spec, detail!.slots, detail!.games);
    const r2 = view.left.columns[1]!.games.find((game) => game.key === "r2-1");
    expect(r2?.sideB.team?.schoolId).toBe(fixture.schoolIds[23]);

    await setBracketGame({
      editionId: edition,
      gameKey: "r1-16",
      homeSide: null,
      siteLabel: null,
      kickoffAt: null,
      sideAScore: null,
      sideBScore: null,
    });
    const games = await db
      .select()
      .from(bracketGamesTable)
      .where(eq(bracketGamesTable.editionId, edition));
    expect(games).toHaveLength(0);
  });

  it("blocks a final game with no winner at the database", async () => {
    const edition = await projection(0);
    await expect(
      db.execute(sql`
        insert into bracket_games (id, edition_id, game_key, status)
        values (gen_random_uuid()::text, ${edition}, 'r1-16', 'final')
      `),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({
        constraint_name: "bracket_games_final_winner_check",
      }),
    });
  });

  it("lists published editions with the official bracket apart", async () => {
    const week1 = await projection(0);
    const week3 = await projection(2);
    await projection(1);
    const official = await createBracketEdition({
      formatId,
      seasonId,
      kind: "official",
      weekId: null,
    });
    for (const id of [week1, week3]) {
      await setBracketEditionStatus({
        editionId: id,
        status: "published",
        userId: null,
      });
    }

    const before = await getPublishedBracketEditions({
      sportSlug: fixture.sportSlug,
      divisionSlug: "fcs",
      year: FIXTURE_YEAR,
    });
    expect(before.official).toBeNull();
    expect(before.projections.map((row) => row.weekNumber)).toEqual([3, 1]);

    await setBracketEditionStatus({
      editionId: official,
      status: "published",
      userId: null,
    });
    const after = await getPublishedBracketEditions({
      sportSlug: fixture.sportSlug,
      divisionSlug: "fcs",
      year: FIXTURE_YEAR,
    });
    expect(after.official?.id).toBe(official);
    expect(after.official?.publishedAt).toBeInstanceOf(Date);
  });

  it("deletes drafts but never a published edition", async () => {
    const draft = await projection(0);
    const published = await projection(1);
    await setBracketEditionStatus({
      editionId: published,
      status: "published",
      userId: null,
    });

    await deleteDraftBracketEdition(draft);
    await expect(deleteDraftBracketEdition(published)).rejects.toThrow(
      BracketInputError,
    );
    await expect(getBracketEdition(draft)).resolves.toBeNull();
  });

  it("reads stats through the projection's week and ignores later results", async () => {
    const edition = await projection(1);
    await fillField(edition, 2);
    const [a, b] = fixture.schoolIds as [string, string];
    const gameRow = (
      week: number,
      home: string,
      away: string,
      hs: number,
      as: number,
    ) => ({
      seasonId,
      weekId: fixture.weekIds[week - 1]!,
      seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
      homeSchoolId: home,
      awaySchoolId: away,
      homeName: "Home",
      awayName: "Away",
      homeLevel: "FCS",
      awayLevel: "FCS",
      homeScore: hs,
      awayScore: as,
      status: "final",
      kickoffAt: new Date(Date.UTC(FIXTURE_YEAR, 8, week * 7)),
      source: "espn",
      sourceGameId: `g-${week}-${home}`,
      dedupeKey: `g-${week}-${home}-${away}`,
    });
    await db
      .insert(gamesTable)
      .values([
        gameRow(1, a, b, 24, 17),
        gameRow(2, b, a, 10, 3),
        gameRow(3, a, b, 42, 0),
      ]);
    await db.insert(pollRankingsTable).values([
      {
        pollId: fixture.pollId,
        weekId: fixture.weekIds[1]!,
        schoolId: a,
        rank: 4,
        points: 400,
        firstPlaceVotes: 2,
      },
      {
        pollId: fixture.pollId,
        weekId: fixture.weekIds[2]!,
        schoolId: a,
        rank: 1,
        points: 600,
      },
    ]);

    const stats = await getBracketTeamStats(edition);
    expect(stats?.asOf).toEqual({
      pollWeek: 2,
      ratingsWeek: null,
      ratingsPoolSize: null,
    });
    expect(stats?.teams[a]).toMatchObject({
      record: { wins: 1, losses: 1 },
      divisionRecord: { wins: 1, losses: 1 },
      poll: { rank: 4, points: 400, firstPlaceVotes: 2, isTie: false },
      ratings: null,
    });
    expect(stats?.teams[b]?.poll).toBeNull();
    expect(stats?.teams[b]?.results.map((result) => result.won)).toEqual([
      false,
      true,
    ]);
  });

  it("returns empty stats for an empty field and null for a missing edition", async () => {
    const edition = await projection(0);
    await expect(getBracketTeamStats(edition)).resolves.toEqual({
      asOf: { pollWeek: null, ratingsWeek: null, ratingsPoolSize: null },
      teams: {},
    });
    await expect(getBracketTeamStats("missing")).resolves.toBeNull();
  });
});
