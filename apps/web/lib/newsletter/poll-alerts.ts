import "server-only";

import type { SportParam } from "@redshirt-sports/clients/espn";
import {
  getFinalRankingsForWeekAndYear,
  getWeeksThatHaveVotes,
  listPollWeeksPublishedSince,
  type PublishedPollWeek,
} from "@redshirt-sports/db/queries";
import { weekTitle } from "@redshirt-sports/db/utils/week-mapping";
import Top25AlertEmail, {
  type AlertTeam,
} from "@redshirt-sports/emails/top-25-alert";
import { createElement } from "react";

import { TOP_25 } from "@/lib/constants";
import { getBaseUrl } from "@/lib/get-base-url";
import { buildSourceUrl } from "@/lib/rankings-api";
import {
  buildRankBySchoolId,
  displayName,
  getMovement,
  getPreviousWeek,
} from "@/lib/rankings-movement";
import {
  type BroadcastResult,
  broadcastOnce,
  RESEND_UNSUBSCRIBE_URL,
} from "./broadcast";
import type { NewsletterConfig } from "./config";
import { emailLogos } from "./email-logos";
import { pollTopic, pollTopicName } from "./topics";

/** Publishes this recent get an alert; the cron runs well inside it. */
const LOOKBACK_MS = 6 * 60 * 60 * 1000;
/** A republish weeks later (a correction) doesn't alert again. */
const ALERT_KEY_TTL_SECONDS = 60 * 24 * 60 * 60;

type Rankings = Awaited<ReturnType<typeof getFinalRankingsForWeekAndYear>>;

/** The Top 25 with movement against the poll's previous published week. */
export function toAlertTeams(
  current: Rankings["rankings"],
  previous: Rankings["rankings"] | null,
): AlertTeam[] {
  const previousRanks = previous ? buildRankBySchoolId(previous) : null;
  return current
    .filter((team) => team.rank != null && team.rank <= TOP_25)
    .map((team) => {
      const movement = previousRanks
        ? getMovement(team.rank, previousRanks.get(team._id))
        : ({ kind: "same" } as const);
      return {
        id: team._id,
        rank: team.rank as number,
        isTie: team.isTie,
        name: displayName(team),
        points: team._points,
        firstPlaceVotes: team.firstPlaceVotes,
        movement: movement.kind === "nr" ? { kind: "new" } : movement,
      };
    });
}

/** "Montana 41, Idaho 12": outside the 25 with points, most first. */
export function othersReceivingVotes(current: Rankings["rankings"]) {
  return current
    .filter(
      (team) => (team.rank == null || team.rank > TOP_25) && team._points > 0,
    )
    .sort((a, b) => b._points - a._points)
    .map((team) => `${displayName(team)} ${team._points}`)
    .join(", ");
}

async function alertContent(pollWeek: PublishedPollWeek) {
  const { pollSlug: division, year, week } = pollWeek;
  const sport = pollWeek.sportSlug as SportParam;
  const current = await getFinalRankingsForWeekAndYear({
    year,
    week,
    division,
    sport,
  });
  const previousWeek = getPreviousWeek(
    await getWeeksThatHaveVotes({ year, division }),
    week,
  );
  const previous =
    previousWeek === undefined
      ? null
      : await getFinalRankingsForWeekAndYear({
          year,
          week: previousWeek,
          division,
          sport,
        });

  const teams = toAlertTeams(current.rankings, previous?.rankings ?? null);
  const pollName = pollTopicName({
    name: pollWeek.pollName,
    sport: { name: pollWeek.sportName },
  });
  const weekLabel = weekTitle(week);
  const pollUrl = buildSourceUrl({ sport, division, year, week });
  const leader = teams[0]?.name;
  return {
    name: `${pollName}: ${year} ${weekLabel}`,
    subject: leader
      ? `${pollName}, ${weekLabel}: ${leader} is No. 1`
      : `${pollName}, ${weekLabel}`,
    previewText: `The ${year} ${pollName} is out. See who moved.`,
    react: createElement(Top25AlertEmail, {
      pollName,
      weekLabel,
      year,
      pollUrl,
      ballotsUrl: `${pollUrl}/ballots`,
      siteUrl: getBaseUrl(),
      teams,
      othersReceivingVotes: othersReceivingVotes(current.rankings),
      unsubscribeUrl: RESEND_UNSUBSCRIBE_URL,
      logo: (await emailLogos()).onDark,
    }),
  };
}

export type PollAlertResult = BroadcastResult & { poll: string; week: number };

/**
 * One alert per newly published poll week, to the readers who opted in to
 * that poll. Publishing happens in admin or the Monday cron; this finds the
 * result in Postgres rather than hooking into either.
 */
export async function sendPollAlerts(
  config: NewsletterConfig,
  now: Date,
): Promise<PollAlertResult[]> {
  const published = await listPollWeeksPublishedSince(
    new Date(now.getTime() - LOOKBACK_MS),
  );
  const results: PollAlertResult[] = [];
  for (const pollWeek of published) {
    const result = await broadcastOnce(config, {
      key: `newsletter:poll:${pollWeek.pollId}:${pollWeek.weekId}`,
      ttlSeconds: ALERT_KEY_TTL_SECONDS,
      topic: pollTopic({
        name: pollWeek.pollName,
        sport: { name: pollWeek.sportName },
      }),
      content: () => alertContent(pollWeek),
    });
    results.push({ ...result, poll: pollWeek.pollName, week: pollWeek.week });
  }
  return results;
}
