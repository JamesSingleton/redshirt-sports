import { finalizeWeeklyRankings } from "@redshirt-sports/db/finalize-rankings";
import { getCurrentSeasonStartAndEnd } from "@redshirt-sports/db/queries";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getCachedSportIdBySlug } from "@/lib/cached-sport";
import { RANKINGS_CACHE_TAG } from "@/lib/rankings-data";
import {
  getCurrentSeason,
  getCurrentWeek,
  type SportParam,
} from "@/utils/espn";

type Params = Promise<{ sport: SportParam; division: string }>;

// Cron job to calculate rankings and store them in the database
// Runs once a week on Sunday at 11:59 PM PST
export async function GET(request: Request, segmentData: { params: Params }) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sport, division } = await segmentData.params;
  const currentDate = new Date();
  const sportId = await getCachedSportIdBySlug(sport);
  if (!sportId) {
    return NextResponse.json(
      { error: `Invalid sport: ${sport}` },
      { status: 400 },
    );
  }

  const season = await getCurrentSeasonStartAndEnd({
    sportId,
    year: currentDate.getFullYear(),
  });

  // Return early if the current date is not within the season as there is no use calculating rankings
  if (
    season &&
    (season.startDate > currentDate || season.endDate < currentDate)
  ) {
    return NextResponse.json({
      response: "Current date is not within the season",
    });
  }

  const [currentSeason, currentWeek] = await Promise.all([
    getCurrentSeason(sport),
    getCurrentWeek(sport),
  ]);

  try {
    const result = await finalizeWeeklyRankings({
      sportId,
      division,
      year: currentSeason.year,
      week: currentWeek,
    });

    if (!result.written) {
      return NextResponse.json({
        response: "No votes found for the current week",
      });
    }

    revalidateTag(RANKINGS_CACHE_TAG, { expire: 0 });
    revalidatePath(`/college/${sport}/rankings`);
    revalidatePath("/");

    return NextResponse.json({
      response: "Rankings calculated and stored in the database",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}
