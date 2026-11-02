import { z } from "zod";

import { type FetchJsonOptions, fetchJson } from "../http";
import { parseScore, type ScoreGame, type ScoreGameStatus } from "./types";

/**
 * NCAA.com scoreboard, used only when ESPN fails for the current week.
 * Its archive is unreliable (finished games can still read "pre" with no score),
 * so callers keep only final games and never let it overwrite an ESPN row.
 * Team ids are NCAA SEO slugs ("norfolk-st"); weeks are NCAA's own, so callers
 * map games to weeks by kickoff date.
 */

const sideSchema = z.looseObject({
  score: z.union([z.string(), z.number()]).nullable().optional(),
  names: z
    .looseObject({
      short: z.string().optional(),
      full: z.string().optional(),
      seo: z.string().optional(),
    })
    .optional(),
});

const gameSchema = z.looseObject({
  game: z.looseObject({
    gameID: z.union([z.string(), z.number()]),
    gameState: z.string().optional(),
    finalMessage: z.string().optional(),
    currentPeriod: z.string().optional(),
    startTimeEpoch: z.union([z.string(), z.number()]).optional(),
    home: sideSchema,
    away: sideSchema,
  }),
});

const boardSchema = z.looseObject({ games: z.array(z.unknown()).default([]) });

export function ncaaScoreboardUrl(input: {
  ncaaPath: string;
  seasonYear: number;
  week: number;
}) {
  return `https://data.ncaa.com/casablanca/scoreboard/${input.ncaaPath}/${input.seasonYear}/${String(input.week).padStart(2, "0")}/scoreboard.json`;
}

function status(state: string | undefined): ScoreGameStatus {
  const value = state?.toLowerCase() ?? "";
  if (value === "final") return "final";
  if (value === "live" || value.includes("progress")) return "in_progress";
  if (value.includes("postpon")) return "postponed";
  if (value.includes("cancel")) return "cancelled";
  return "scheduled";
}

export function parseNcaaScoreboard(payload: unknown): {
  games: ScoreGame[];
  skipped: number;
} {
  const board = boardSchema.parse(payload);
  const games: ScoreGame[] = [];
  let skipped = 0;
  for (const raw of board.games) {
    const parsed = gameSchema.safeParse(raw);
    if (!parsed.success) {
      skipped += 1;
      continue;
    }
    const game = parsed.data.game;
    const epoch = Number(game.startTimeEpoch);
    const gameStatus = status(game.gameState);
    games.push({
      source: "ncaa",
      sourceGameId: String(game.gameID),
      seasonType: null,
      weekNumber: null,
      kickoffAt:
        Number.isFinite(epoch) && epoch > 0
          ? new Date(epoch * 1000).toISOString()
          : null,
      // The NCAA feed doesn't say; ESPN data replaces these rows once it's back.
      neutralSite: false,
      overtime: /\bOT\b/i.test(
        `${game.finalMessage ?? ""} ${game.currentPeriod ?? ""}`,
      ),
      status: gameStatus,
      home: {
        externalId: game.home.names?.seo ?? null,
        name:
          game.home.names?.full?.trim() ||
          game.home.names?.short?.trim() ||
          "Unknown",
        shortName:
          game.home.names?.short?.trim() ||
          game.home.names?.full?.trim() ||
          "Unknown",
        score: parseScore(game.home.score),
      },
      away: {
        externalId: game.away.names?.seo ?? null,
        name:
          game.away.names?.full?.trim() ||
          game.away.names?.short?.trim() ||
          "Unknown",
        shortName:
          game.away.names?.short?.trim() ||
          game.away.names?.full?.trim() ||
          "Unknown",
        score: parseScore(game.away.score),
      },
    });
  }
  return { games, skipped };
}

export async function fetchNcaaScoreboard(
  input: { ncaaPath: string; seasonYear: number; week: number },
  options?: FetchJsonOptions,
) {
  return parseNcaaScoreboard(
    await fetchJson(ncaaScoreboardUrl(input), options),
  );
}
