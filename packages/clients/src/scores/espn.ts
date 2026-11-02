import { z } from "zod";

import { type FetchJsonOptions, fetchJson } from "../http";
import { parseScore, type ScoreGame, type ScoreGameStatus } from "./types";

const SITE = "https://site.api.espn.com/apis/site/v2/sports";
const SITE_WEB = "https://site.web.api.espn.com/apis/site/v2/sports";
const CORE = "https://sports.core.api.espn.com/v2/sports";

/** site.api.espn.com sometimes 403s server clients; site.web.api is the same API. */
function siteFallback(url: string): string | null {
  return url.startsWith(SITE) ? SITE_WEB + url.slice(SITE.length) : null;
}

function leaguePath(espnLeague: string): { sport: string; league: string } {
  const [sport, league] = espnLeague.split("/");
  if (!sport || !league) {
    throw new Error(
      `ESPN league must look like "football/college-football", got "${espnLeague}".`,
    );
  }
  return { sport, league };
}

const competitorSchema = z.looseObject({
  homeAway: z.string().optional(),
  score: z.union([z.string(), z.number()]).nullable().optional(),
  team: z
    .looseObject({
      id: z.union([z.string(), z.number()]).optional(),
      displayName: z.string().optional(),
      shortDisplayName: z.string().optional(),
      location: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
});

const eventSchema = z.looseObject({
  id: z.union([z.string(), z.number()]),
  date: z.string().optional(),
  season: z.looseObject({ type: z.number().optional() }).optional(),
  week: z.looseObject({ number: z.number().optional() }).optional(),
  competitions: z
    .array(
      z.looseObject({
        neutralSite: z.boolean().optional(),
        date: z.string().optional(),
        competitors: z.array(competitorSchema).optional(),
        status: z
          .looseObject({
            period: z.number().optional(),
            type: z
              .looseObject({
                name: z.string().optional(),
                state: z.string().optional(),
                completed: z.boolean().optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const scoreboardSchema = z.looseObject({
  season: z
    .looseObject({ year: z.number().optional(), type: z.number().optional() })
    .optional(),
  week: z.looseObject({ number: z.number().optional() }).optional(),
  events: z.array(z.unknown()).default([]),
});

export function mapEspnStatus(type: {
  name?: string;
  state?: string;
  completed?: boolean;
}): ScoreGameStatus {
  const name = type.name?.toUpperCase() ?? "";
  if (name.includes("POSTPONED")) return "postponed";
  // Cancelled and forfeited games have no meaningful score.
  if (name.includes("CANCEL") || name.includes("FORFEIT")) return "cancelled";
  if (
    name.includes("FINAL") ||
    type.completed === true ||
    type.state === "post"
  )
    return "final";
  if (
    type.state === "in" ||
    name.includes("IN_PROGRESS") ||
    name.includes("HALFTIME") ||
    name.includes("END_PERIOD")
  ) {
    return "in_progress";
  }
  return "scheduled";
}

function teamName(team: z.infer<typeof competitorSchema>["team"]): string {
  return (
    team?.displayName?.trim() ||
    [team?.location, team?.name].filter(Boolean).join(" ").trim() ||
    team?.shortDisplayName?.trim() ||
    "Unknown"
  );
}

function shortTeamName(team: z.infer<typeof competitorSchema>["team"]): string {
  return (
    team?.location?.trim() || team?.shortDisplayName?.trim() || teamName(team)
  );
}

/**
 * Parse an ESPN scoreboard. Blank or malformed events are skipped rather than
 * failing the whole week; `skipped` reports how many.
 */
export function parseEspnScoreboard(
  payload: unknown,
  regulationPeriods: number,
): { games: ScoreGame[]; skipped: number } {
  const board = scoreboardSchema.parse(payload);
  const games: ScoreGame[] = [];
  let skipped = 0;
  for (const raw of board.events) {
    const parsed = eventSchema.safeParse(raw);
    const competition = parsed.success
      ? parsed.data.competitions?.[0]
      : undefined;
    const home = competition?.competitors?.find((c) => c.homeAway === "home");
    const away = competition?.competitors?.find((c) => c.homeAway === "away");
    if (!parsed.success || !competition || !home?.team || !away?.team) {
      skipped += 1;
      continue;
    }
    const event = parsed.data;
    const status = mapEspnStatus(competition.status?.type ?? {});
    games.push({
      source: "espn",
      sourceGameId: String(event.id),
      seasonType: event.season?.type ?? board.season?.type ?? null,
      weekNumber: event.week?.number ?? board.week?.number ?? null,
      kickoffAt: event.date ?? competition.date ?? null,
      neutralSite: competition.neutralSite === true,
      overtime:
        status === "final" &&
        (competition.status?.period ?? 0) > regulationPeriods,
      status,
      home: {
        externalId: home.team.id == null ? null : String(home.team.id),
        name: teamName(home.team),
        shortName: shortTeamName(home.team),
        score: parseScore(home.score),
      },
      away: {
        externalId: away.team.id == null ? null : String(away.team.id),
        name: teamName(away.team),
        shortName: shortTeamName(away.team),
        score: parseScore(away.score),
      },
    });
  }
  return { games, skipped };
}

export type EspnScoreboardQuery =
  | { seasonYear: number; seasonType: number; week: number }
  | { date: string };

export function espnScoreboardUrl(input: {
  espnLeague: string;
  groups: string;
  query: EspnScoreboardQuery;
}): string {
  const { sport, league } = leaguePath(input.espnLeague);
  const url = new URL(`${SITE}/${sport}/${league}/scoreboard`);
  url.searchParams.set("groups", input.groups);
  url.searchParams.set("limit", "500");
  if ("date" in input.query) {
    url.searchParams.set("dates", input.query.date.replaceAll("-", ""));
  } else {
    url.searchParams.set("seasontype", String(input.query.seasonType));
    url.searchParams.set("week", String(input.query.week));
    url.searchParams.set("dates", String(input.query.seasonYear));
  }
  return url.toString();
}

export async function fetchEspnScoreboard(
  input: {
    espnLeague: string;
    groups: string;
    regulationPeriods: number;
    query: EspnScoreboardQuery;
  },
  options?: FetchJsonOptions,
) {
  const url = espnScoreboardUrl(input);
  const payload = await fetchJson(url, {
    fallbackUrl: siteFallback(url),
    ...options,
  });
  return parseEspnScoreboard(payload, input.regulationPeriods);
}

const membershipSchema = z.looseObject({
  pageCount: z.number().optional(),
  items: z.array(z.object({ $ref: z.string() })).default([]),
});

export function espnIdFromRef(ref: string): string | null {
  return ref.match(/\/teams\/(\d+)/)?.[1] ?? null;
}

/** ESPN team ids in a group for a season, e.g. FCS (81) in 2025. */
export async function fetchEspnGroupMembers(
  input: {
    espnLeague: string;
    groupId: string;
    seasonYear: number;
    seasonType?: number;
  },
  options?: FetchJsonOptions,
): Promise<string[]> {
  const { sport, league } = leaguePath(input.espnLeague);
  const ids = new Set<string>();
  for (let page = 1; page <= 10; page += 1) {
    const url = `${CORE}/${sport}/leagues/${league}/seasons/${input.seasonYear}/types/${input.seasonType ?? 2}/groups/${input.groupId}/teams?limit=500&page=${page}`;
    const body = membershipSchema.parse(await fetchJson(url, options));
    for (const item of body.items) {
      const id = espnIdFromRef(item.$ref);
      if (id) ids.add(id);
    }
    if ((body.pageCount ?? 1) <= page) break;
  }
  return [...ids].sort((a, b) => Number(a) - Number(b));
}

const teamSchema = z.looseObject({
  id: z.union([z.string(), z.number()]),
  displayName: z.string().optional(),
  shortDisplayName: z.string().optional(),
  abbreviation: z.string().optional(),
  location: z.string().optional(),
  name: z.string().optional(),
  nickname: z.string().optional(),
  slug: z.string().optional(),
});

export type EspnTeam = {
  espnId: string;
  displayName: string;
  shortDisplayName: string | null;
  abbreviation: string | null;
  location: string | null;
  mascot: string | null;
};

export function parseEspnTeam(payload: unknown): EspnTeam {
  const team = teamSchema.parse(payload);
  const displayName =
    team.displayName?.trim() ||
    [team.location, team.name].filter(Boolean).join(" ").trim();
  if (!displayName) {
    throw new Error(`ESPN team ${team.id} has no name.`);
  }
  return {
    espnId: String(team.id),
    displayName,
    shortDisplayName: team.shortDisplayName ?? null,
    abbreviation: team.abbreviation ?? null,
    location: team.location ?? null,
    mascot: team.name ?? null,
  };
}

/** One team's names, for matching an ESPN id to a Redshirt school. */
export async function fetchEspnTeam(
  input: { espnLeague: string; espnId: string },
  options?: FetchJsonOptions,
): Promise<EspnTeam> {
  const { sport, league } = leaguePath(input.espnLeague);
  const payload = await fetchJson(
    `${CORE}/${sport}/leagues/${league}/teams/${encodeURIComponent(input.espnId)}`,
    options,
  );
  return parseEspnTeam(payload);
}

const groupSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().optional(),
  shortName: z.string().optional(),
  abbreviation: z.string().optional(),
});

export type EspnConference = {
  groupId: string;
  name: string;
  shortName: string;
};

/**
 * Each team's conference in a group for one season (FCS has ~14 conference groups).
 * Conferences change, so archives need the season's own lineup, not today's.
 */
export async function fetchEspnGroupConferences(
  input: {
    espnLeague: string;
    groupId: string;
    seasonYear: number;
    seasonType?: number;
  },
  options?: FetchJsonOptions,
): Promise<Map<string, EspnConference>> {
  const { sport, league } = leaguePath(input.espnLeague);
  const base = `${CORE}/${sport}/leagues/${league}/seasons/${input.seasonYear}/types/${input.seasonType ?? 2}/groups`;
  const children = membershipSchema.parse(
    await fetchJson(`${base}/${input.groupId}/children?limit=100`, options),
  );
  const byTeam = new Map<string, EspnConference>();
  for (const child of children.items) {
    const groupId = child.$ref.match(/\/groups\/(\d+)/)?.[1];
    if (!groupId) continue;
    const group = groupSchema.parse(
      await fetchJson(`${base}/${groupId}`, options),
    );
    const conference = {
      groupId,
      name: group.name ?? `Group ${groupId}`,
      shortName:
        group.shortName ??
        group.abbreviation ??
        group.name ??
        `Group ${groupId}`,
    };
    const teams = membershipSchema.parse(
      await fetchJson(`${base}/${groupId}/teams?limit=500`, options),
    );
    for (const item of teams.items) {
      const id = espnIdFromRef(item.$ref);
      if (id) byTeam.set(id, conference);
    }
  }
  return byTeam;
}
