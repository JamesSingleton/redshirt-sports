import { auth } from "@redshirt-sports/auth/server";
import {
  getSportIdBySlug,
  getVoterBallotSchoolEntries,
  getVotingSeasonInfoBySportIds,
} from "@redshirt-sports/db/queries";
import type { SanityImageInput } from "@redshirt-sports/sanity/image";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import CustomImage from "@/components/sanity-image";
import { BallotShareActions } from "@/components/vote/ballot-share-actions";
import { confirmationTitle } from "@/lib/ballot-share-labels";
import type { SportParam } from "@/utils/espn";

export const metadata: Metadata = {
  title: `Vote Confirmation | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: "Thank you for voting for the top 25 college football teams.",
  robots: {
    follow: false,
    index: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function VoteConfirmationPage({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  return (
    <Suspense>
      <VoteConfirmationContent params={params} />
    </Suspense>
  );
}

/** Exported for Vitest — confirmation body without Suspense wrapper. */
export async function VoteConfirmationContent({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  const { sport, division } = await params;
  const headerTitle = confirmationTitle(sport, division);
  const { userId } = await auth.protect();

  const sportId = await getSportIdBySlug(sport as SportParam);
  if (!sportId) {
    redirect(`/vote/college/${sport}/${division}`);
  }

  const seasonInfo = (await getVotingSeasonInfoBySportIds([sportId])).get(
    sportId,
  );
  if (!seasonInfo) {
    redirect(`/vote/college/${sport}/${division}`);
  }

  const entries = await getVoterBallotSchoolEntries({
    userId,
    sportId,
    division,
    year: seasonInfo.year,
    week: seasonInfo.votingWeek,
  });

  if (!entries.length) {
    redirect(`/vote/college/${sport}/${division}`);
  }

  return (
    <div className="container flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">{headerTitle}</h1>
        <p className="text-muted-foreground">
          Thank you for casting your vote. Your rankings have been successfully
          submitted.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {entries.map((entry) => (
          <div
            className="flex flex-col items-center gap-2"
            key={`${entry.rank}-${entry.schoolId}`}
          >
            <div className="flex h-16 w-16 flex-col justify-center">
              <CustomImage
                image={entry.image as SanityImageInput}
                width={60}
                height={60}
              />
            </div>
            <p className="text-center font-semibold">
              {entry.rank}.{" "}
              {entry.shortName ?? entry.abbreviation ?? entry.name}
            </p>
          </div>
        ))}
      </div>
      <BallotShareActions
        sport={sport}
        division={division}
        week={seasonInfo.votingWeek}
      />
      <div>
        <Link href="/" className={buttonVariants()}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
