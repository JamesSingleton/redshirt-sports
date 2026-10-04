import { auth } from "@redshirt-sports/auth/server";
import {
  arePollRankingsPublished,
  getPollBySportAndSlug,
  getSportIdBySlug,
  getVoterBallots,
  resolveWeekIdForLegacyWeek,
} from "@redshirt-sports/db/queries";
import { client } from "@redshirt-sports/sanity/client";
import { schoolsByIdQuery } from "@redshirt-sports/sanity/queries";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import PageHeader from "@/components/page-header";
import CustomImage from "@/components/sanity-image";
import { getCurrentSeason, getVotingWeek, type SportParam } from "@/utils/espn";
import { transformBallotToTeamIds } from "@/utils/process-ballots";

function generateConfirmationHeader(sport: string, division: string) {
  const sportNames = {
    football: "College Football",
    "mens-basketball": "Men's College Basketball",
    "womens-basketball": "Women's College Basketball",
  };

  const divisionNames = {
    fbs: "Football Bowl Subdivision (FBS)",
    fcs: "Football Championship Subdivision (FCS)",
    d2: "Division II",
    d3: "Division III",
    "mid-major": "Mid-Major Conferences",
    "power-conferences": "Power Conferences",
  };

  const sportName = sportNames[sport as keyof typeof sportNames] || sport;
  const divisionName =
    divisionNames[division as keyof typeof divisionNames] || division;

  return {
    title: `Your ${divisionName} ${sportName} Top 25 Vote is In!`,
  };
}

export const metadata: Metadata = {
  title: "Vote Confirmation",
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
  const header = generateConfirmationHeader(sport, division);
  const { userId } = await auth.protect();

  const [votingWeek, { year }, sportId] = await Promise.all([
    getVotingWeek(sport as SportParam),
    getCurrentSeason(sport as SportParam),
    getSportIdBySlug(sport as SportParam),
  ]);

  const ballot = await getVoterBallots({
    year,
    week: votingWeek,
    division,
    sportId: sportId || "",
    userId: userId,
  });

  if (userId && !ballot.length) {
    redirect(`/vote/college/${sport}/${division}`);
  }

  const poll =
    sportId != null && sportId !== ""
      ? await getPollBySportAndSlug({ sportId, slug: division })
      : null;
  const weekId =
    poll && sportId
      ? await resolveWeekIdForLegacyWeek({
          sportId,
          year,
          legacyWeek: votingWeek,
        })
      : null;
  const published =
    poll && weekId
      ? await arePollRankingsPublished({ pollId: poll.id, weekId })
      : false;
  const canEdit = !published;

  const schools = await client.fetch(schoolsByIdQuery, {
    ids: transformBallotToTeamIds(ballot),
  });

  return (
    <>
      <PageHeader
        title={header.title}
        subtitle={
          canEdit
            ? "Thanks for voting. You can edit your ballot until this week's rankings are published."
            : "Thanks for voting. This week's rankings have been published, so your ballot is locked."
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          {canEdit ? (
            <Link
              href={`/vote/college/${sport}/${division}?edit=1`}
              className={buttonVariants()}
            >
              Edit ballot
            </Link>
          ) : null}
          <Link
            href="/"
            className={buttonVariants({
              variant: canEdit ? "outline" : "default",
            })}
          >
            Return home
          </Link>
        </div>
      </PageHeader>
      <section aria-label="Your ballot" className="container pb-12">
        <ol className="bg-border grid grid-cols-1 gap-px overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-flow-col lg:grid-cols-5 lg:grid-rows-5">
          {schools.map((school, index) => (
            <li
              key={school._id}
              className="bg-card flex items-center gap-3 px-4 py-3"
            >
              <span className="rank-numeral text-muted-foreground w-6 text-right text-lg">
                {index + 1}
              </span>
              <CustomImage
                image={school.image}
                width={32}
                height={32}
                mode="contain"
                className="size-8 shrink-0 object-contain"
              />
              <span className="truncate font-semibold">
                {school.shortName ?? school.abbreviation ?? school.name}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
