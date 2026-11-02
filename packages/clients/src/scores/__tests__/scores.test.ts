import { describe, expect, it, vi } from "vitest";

import { fetchJson } from "../../http";
import {
  espnIdFromRef,
  espnScoreboardUrl,
  mapEspnStatus,
  parseEspnScoreboard,
} from "../espn";
import { parseNcaaScoreboard } from "../ncaa";
import week1 from "./fixtures/espn-fcs-2025-week1.json";

describe("ESPN scoreboard", () => {
  it("parses real events and skips the blank one", () => {
    const { games, skipped } = parseEspnScoreboard(week1, 4);
    expect(games).toHaveLength(5);
    expect(skipped).toBe(1);
    for (const game of games) {
      expect(game.source).toBe("espn");
      expect(game.home.externalId).toMatch(/^\d+$/);
      expect(game.seasonType).toBe(2);
      expect(game.weekNumber).toBe(1);
      expect(game.status).toBe("final");
      expect(game.home.score).not.toBeNull();
    }
  });

  it("flags overtime only past regulation", () => {
    const payload = {
      events: [
        {
          id: 1,
          competitions: [
            {
              status: {
                period: 5,
                type: { name: "STATUS_FINAL", completed: true },
              },
              competitors: [
                {
                  homeAway: "home",
                  score: "31",
                  team: { id: "1", displayName: "A" },
                },
                {
                  homeAway: "away",
                  score: "28",
                  team: { id: "2", displayName: "B" },
                },
              ],
            },
          ],
        },
      ],
    };
    expect(parseEspnScoreboard(payload, 4).games[0]?.overtime).toBe(true);
    expect(parseEspnScoreboard(payload, 5).games[0]?.overtime).toBe(false);
  });

  it("maps statuses, including cancellations and forfeits", () => {
    expect(mapEspnStatus({ name: "STATUS_FINAL" })).toBe("final");
    expect(mapEspnStatus({ name: "STATUS_POSTPONED" })).toBe("postponed");
    expect(mapEspnStatus({ name: "STATUS_CANCELED" })).toBe("cancelled");
    expect(mapEspnStatus({ name: "STATUS_FORFEIT" })).toBe("cancelled");
    expect(mapEspnStatus({ name: "STATUS_HALFTIME", state: "in" })).toBe(
      "in_progress",
    );
    expect(mapEspnStatus({ name: "STATUS_SCHEDULED", state: "pre" })).toBe(
      "scheduled",
    );
  });

  it("builds week and date scoreboard URLs for any league", () => {
    expect(
      espnScoreboardUrl({
        espnLeague: "football/college-football",
        groups: "81",
        query: { seasonYear: 2025, seasonType: 2, week: 10 },
      }),
    ).toContain(
      "/football/college-football/scoreboard?groups=81&limit=500&seasontype=2&week=10&dates=2025",
    );
    expect(
      espnScoreboardUrl({
        espnLeague: "basketball/mens-college-basketball",
        groups: "50",
        query: { date: "2026-01-14" },
      }),
    ).toContain(
      "/basketball/mens-college-basketball/scoreboard?groups=50&limit=500&dates=20260114",
    );
  });

  it("reads team ids from core API refs", () => {
    expect(
      espnIdFromRef(
        "http://sports.core.api.espn.com/v2/.../seasons/2025/teams/2450?lang=en",
      ),
    ).toBe("2450");
  });
});

describe("NCAA scoreboard", () => {
  it("parses sides by SEO slug and reads overtime from the final message", () => {
    const { games } = parseNcaaScoreboard({
      games: [
        {
          game: {
            gameID: "1",
            gameState: "final",
            finalMessage: "FINAL (OT)",
            startTimeEpoch: "1761867000",
            home: {
              score: "27",
              names: { seo: "delaware-st", full: "Delaware State University" },
            },
            away: {
              score: "20",
              names: { seo: "norfolk-st", full: "Norfolk State University" },
            },
          },
        },
        { nonsense: true },
      ],
    });
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({
      source: "ncaa",
      status: "final",
      overtime: true,
      home: { externalId: "delaware-st", score: 27 },
      away: { externalId: "norfolk-st", score: 20 },
      kickoffAt: "2025-10-30T23:30:00.000Z",
    });
  });
});

describe("fetchJson", () => {
  const ok = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200 });

  it("retries 5xx then succeeds", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(ok({ ok: true }));
    await expect(
      fetchJson("https://x.test/a", { fetchImpl, sleep: async () => {} }),
    ).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 404", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("", { status: 404 }));
    await expect(
      fetchJson("https://x.test/a", { fetchImpl, sleep: async () => {} }),
    ).rejects.toThrow("404");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("tries the fallback host once on 403", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("", { status: 403 }))
      .mockResolvedValueOnce(ok({ via: "fallback" }));
    await expect(
      fetchJson("https://x.test/a", {
        fetchImpl,
        fallbackUrl: "https://y.test/a",
        sleep: async () => {},
      }),
    ).resolves.toEqual({ via: "fallback" });
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("https://y.test/a");
  });
});
