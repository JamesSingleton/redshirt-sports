import { auth } from "@redshirt-sports/auth/server";
import {
  getSportIdBySlug,
  getUserById,
  getVoterBallotSchoolEntries,
  getVotingSeasonInfoBySportIds,
} from "@redshirt-sports/db/queries";
import { ImageResponse } from "next/og";

import {
  BALLOT_SHARE_HEIGHT,
  BALLOT_SHARE_WIDTH,
  BallotShareImage,
} from "@/lib/ballot-share-image";
import { ballotShareFilename } from "@/lib/ballot-share-labels";
import { validateDivision, validateSport } from "@/lib/vote-ballot";
import { ratelimit } from "@/server/ratelimit";

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  try {
    const { sport: sportSlug, division } = await params;
    const validatedSport = validateSport(sportSlug);
    const validatedDivision = validateDivision(division);

    const user = await auth();
    if (!user.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { success: withinRateLimit } = await ratelimit.limit(
      `ballot-share-image:${user.userId}`,
    );
    if (!withinRateLimit) {
      return jsonError(
        "Too many share image requests. Please try again shortly.",
        429,
      );
    }

    const sportId = await getSportIdBySlug(validatedSport);
    if (!sportId) {
      return jsonError(`Sport not found: ${validatedSport}`, 404);
    }

    const seasonInfo = (await getVotingSeasonInfoBySportIds([sportId])).get(
      sportId,
    );
    if (!seasonInfo) {
      return jsonError("Season info not found", 404);
    }

    const [entries, voter] = await Promise.all([
      getVoterBallotSchoolEntries({
        userId: user.userId,
        sportId,
        division: validatedDivision,
        year: seasonInfo.year,
        week: seasonInfo.votingWeek,
      }),
      getUserById(user.userId),
    ]);

    if (!entries.length) {
      return jsonError("No ballot found for the current voting week", 404);
    }

    const voterName = voter
      ? `${voter.firstName} ${voter.lastName}`.trim()
      : "Voter";
    const organization = voter?.organization ?? null;
    const filename = ballotShareFilename({
      division: validatedDivision,
      week: seasonInfo.votingWeek,
    });

    const image = new ImageResponse(
      <BallotShareImage
        entries={entries}
        division={validatedDivision}
        week={seasonInfo.votingWeek}
        voterName={voterName}
        organization={organization}
      />,
      {
        width: BALLOT_SHARE_WIDTH,
        height: BALLOT_SHARE_HEIGHT,
      },
    );

    image.headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );
    image.headers.set("Cache-Control", "private, no-store");

    return image;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return jsonError(error.message, 400);
    }
    console.error("ballot share-image error:", error);
    return jsonError("Failed to generate share image", 500);
  }
}
