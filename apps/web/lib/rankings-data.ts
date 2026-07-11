import {
  getFinalRankingsDisplayPayload,
  getFinalRankingsForWeekAndYear,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
  type SportParam,
} from "@redshirt-sports/db/queries";
import { client } from "@redshirt-sports/sanity/client";
import { schoolsByIdsQuery } from "@redshirt-sports/sanity/queries";
import { token } from "@redshirt-sports/sanity/token";
import { cacheTag } from "next/cache";

/** Invalidate with revalidateTag("rankings") after finalize / transform. */
export const RANKINGS_CACHE_TAG = "rankings";

type SchoolWithImage = {
  _id: string;
  name?: string | null;
  shortName?: string | null;
  abbreviation?: string | null;
  image?: unknown;
};

export async function getCachedYearsThatHaveVotes({
  division,
}: {
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  return getYearsThatHaveVotes({ division });
}

export async function getCachedWeeksThatHaveVotes({
  year,
  division,
}: {
  year: number;
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  return getWeeksThatHaveVotes({ year, division });
}

export async function getCachedFinalRankings({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);

  const displayPayload = await getFinalRankingsDisplayPayload({
    year,
    week,
    division,
    sport: sport as SportParam,
  });

  const base =
    displayPayload ??
    (await getFinalRankingsForWeekAndYear({ year, week, division }));

  const ids = base.rankings.map((ranking) => ranking._id).filter(Boolean);

  const schools =
    ids.length > 0
      ? await client.fetch<SchoolWithImage[]>(
          schoolsByIdsQuery,
          { ids },
          { token, perspective: "published" },
        )
      : [];

  const schoolById = new Map(schools.map((school) => [school._id, school]));

  const rankings = base.rankings.map((entry) => {
    const school = schoolById.get(entry._id);
    return {
      ...entry,
      image:
        school?.image ??
        ("image" in entry ? (entry as { image?: unknown }).image : null) ??
        null,
    };
  });

  return {
    id: "id" in base ? (base as { id?: number }).id : undefined,
    division: base.division,
    week: base.week,
    year: base.year,
    rankings,
  };
}
