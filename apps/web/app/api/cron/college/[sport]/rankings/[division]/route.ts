import {
  getCurrentSeasonStartAndEnd,
  getSportIdBySlug,
  publishPollRankingsForWeek,
} from "@redshirt-sports/db/queries";
import { NextResponse } from "next/server";

import {
  getCurrentSeason,
  getCurrentWeek,
  type SportParam,
} from "@/utils/espn";

type Params = Promise<{ sport: SportParam; division: string }>;

export async function GET(_request: Request, segmentData: { params: Params }) {
  const { sport, division } = await segmentData.params;
  const currentDate = new Date();
  const sportId = await getSportIdBySlug(sport);
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
    const result = await publishPollRankingsForWeek({
      sport,
      division,
      year: currentSeason.year,
      week: currentWeek,
    });

    return NextResponse.json({
      response: "Rankings calculated and stored in the database",
      teams: result.teams,
      ballots: result.ballots,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("No ballots")) {
      return NextResponse.json({ response: message });
    }
    if (message.includes("not found") || message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.error();
  }
}
