import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import {
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankings,
  getPollBySportSlugAndPollSlug,
} from "@redshirt-sports/db/queries";
import {
  calendarWeekKey,
  legacyWeekToSeasonTypeAndNumber,
  weekTitle,
} from "@redshirt-sports/db/utils/week-mapping";

import { getBaseUrl } from "@/lib/get-base-url";
import {
  type ValidDivision,
  validateDivision,
  validateSport,
} from "@/lib/vote-ballot";
import type { SportParam } from "@/utils/espn";

const TOP_25_MAX_RANK = 25;

export type PublicSchool = {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  slug: string | null;
};

export type PublicRankingEntry = {
  rank: number | null;
  isTie: boolean;
  points: number;
  firstPlaceVotes: number;
  school: PublicSchool;
};

export type PublicRankingsResponse = {
  poll: {
    sport: SportParam;
    division: ValidDivision;
    name: string;
    slug: ValidDivision;
  };
  season: {
    year: number;
  };
  week: {
    number: number;
    label: string;
    segment: string;
    weekKey: string;
    seasonType: number;
    weekNumber: number;
  };
  sourceUrl: string;
  /** Top 25 (ranks 1–25), including ties. */
  rankings: PublicRankingEntry[];
  /**
   * Teams that appeared on at least one ballot but finished outside the Top 25.
   * Ordered by points descending. `rank` is always null here.
   */
  othersReceivingVotes: PublicRankingEntry[];
};

type InternalRankings = Awaited<
  ReturnType<typeof getFinalRankingsForWeekAndYear>
>;

function mapEntry(
  row: InternalRankings["rankings"][number],
): PublicRankingEntry {
  return {
    rank: row.rank,
    isTie: row.isTie,
    points: row._points,
    firstPlaceVotes: row.firstPlaceVotes,
    school: {
      id: row._id,
      name: row.name,
      shortName: row.shortName,
      abbreviation: row.abbreviation,
      slug: row.slug,
    },
  };
}

export function buildSourceUrl({
  sport,
  division,
  year,
  week,
  baseUrl = getBaseUrl(),
}: {
  sport: SportParam;
  division: string;
  year: number;
  week: number;
  baseUrl?: string;
}): string {
  const segment = formatWeekSegment(week);
  return `${baseUrl}/college/${sport}/rankings/${division}/${year}/${segment}`;
}

export function toPublicRankingsResponse({
  sport,
  division,
  pollName,
  data,
  baseUrl = getBaseUrl(),
}: {
  sport: SportParam;
  division: ValidDivision;
  pollName: string;
  data: InternalRankings;
  baseUrl?: string;
}): PublicRankingsResponse {
  const calendar = legacyWeekToSeasonTypeAndNumber(data.week);
  const rankings: PublicRankingEntry[] = [];
  const othersReceivingVotes: PublicRankingEntry[] = [];

  for (const row of data.rankings) {
    const entry = mapEntry(row);
    if (row.rank != null && row.rank <= TOP_25_MAX_RANK) {
      rankings.push(entry);
    } else {
      // Published rows may keep an ordinal > 25; partners only care about points.
      othersReceivingVotes.push({ ...entry, rank: null });
    }
  }

  return {
    poll: {
      sport,
      division,
      name: pollName,
      slug: division,
    },
    season: {
      year: data.year,
    },
    week: {
      number: data.week,
      label: weekTitle(data.week),
      segment: formatWeekSegment(data.week),
      weekKey: calendarWeekKey(calendar.seasonType, calendar.weekNumber),
      seasonType: calendar.seasonType,
      weekNumber: calendar.weekNumber,
    },
    sourceUrl: buildSourceUrl({
      sport,
      division,
      year: data.year,
      week: data.week,
      baseUrl,
    }),
    rankings,
    othersReceivingVotes,
  };
}

export type ResolvePublicRankingsResult =
  | { ok: true; body: PublicRankingsResponse }
  | { ok: false; status: number; error: string };

export async function resolvePublicRankings({
  sportSlug,
  divisionSlug,
  year,
  week,
}: {
  sportSlug: string;
  divisionSlug: string;
  year?: number;
  week?: number;
}): Promise<ResolvePublicRankingsResult> {
  let sport: SportParam;
  let division: ValidDivision;
  try {
    sport = validateSport(sportSlug);
    division = validateDivision(divisionSlug);
  } catch (error) {
    return {
      ok: false,
      status: 400,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const poll = await getPollBySportSlugAndPollSlug({
    sportSlug: sport,
    pollSlug: division,
  });
  if (!poll) {
    return { ok: false, status: 404, error: "Poll not found" };
  }

  let resolvedYear = year;
  let resolvedWeek = week;

  if (resolvedYear == null || resolvedWeek == null) {
    const latest = await getLatestFinalRankings({ division });
    if (!latest) {
      return { ok: false, status: 404, error: "Rankings not found" };
    }
    resolvedYear = latest.year;
    resolvedWeek = latest.week;
  }

  try {
    const data = await getFinalRankingsForWeekAndYear({
      year: resolvedYear,
      week: resolvedWeek,
      division,
      sport,
    });

    return {
      ok: true,
      body: toPublicRankingsResponse({
        sport,
        division,
        pollName: poll.name,
        data,
      }),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Rankings not found";
    if (message.includes("not found") || message.includes("Unable to find")) {
      return { ok: false, status: 404, error: "Rankings not found" };
    }
    throw error;
  }
}
