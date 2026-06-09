import { auth } from "@clerk/nextjs/server";
import {
  getLatestVoterBallot,
  getSportIdBySlug,
  hasVoterVoted,
} from "@redshirt-sports/db/queries";
import { client } from "@redshirt-sports/sanity/client";
import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import {
  schoolsBySportAndSubgroupingStringQuery,
  schoolsForVotesQuery,
} from "@redshirt-sports/sanity/queries";
import type { SchoolsBySportAndSubgroupingStringQueryResult } from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import VoteFormWrapper from "@/components/vote-form-wrapper";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import {
  getCurrentSeason,
  getCurrentWeek,
  type SportParam,
  SportSchema,
} from "@/utils/espn";

const ParamsSchema = z.object({
  sport: SportSchema,
  division: z.string(),
});

type VoterBallotWithSchool = {
  id: number;
  userId: string;
  division: string;
  week: number;
  year: number;
  createdAt: Date;
  teamId: string;
  rank: number;
  points: number;
  schoolName: string;
  schoolShortName: string;
  schoolAbbreviation: string;
  schoolNickname: string;
  schoolImageUrl: string;
};

async function getLatestVoterBallotWithSchools(
  userId: string,
  division: string,
  sport: SportParam,
  currentYear: number,
): Promise<VoterBallotWithSchool[]> {
  const ballots = await getLatestVoterBallot(
    userId,
    division,
    sport,
    currentYear,
  );
  const schoolIds = ballots.map((ballot) => ballot.teamId);

  const schools = await client.fetch(schoolsForVotesQuery, { schoolIds });

  const ballotsWithSchools: VoterBallotWithSchool[] = ballots.map((ballot) => {
    const school = schools.find(
      (s: { _id: string }) => s._id === ballot.teamId,
    );
    return {
      ...ballot,
      schoolName: school?.name || "",
      schoolShortName: school?.shortName || "",
      schoolAbbreviation: school?.abbreviation || "",
      schoolNickname: school?.nickname || "",
      schoolImageUrl: school?.image || "",
    };
  });

  return ballotsWithSchools;
}

export const metadata: Metadata = {
  title: `College Football Top 25 Voting | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: "Vote for the top 25 college football teams.",
  robots: {
    follow: false,
    index: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

const divisionHeader = [
  {
    division: "fbs",
    title: "Football Bowl Subdivision (FBS)",
    subtitle:
      "Cast your vote for the top 25 Football Bowl Subdivision (FBS) football teams.",
  },
  {
    division: "fcs",
    title: "Football Championship Subdivision (FCS)",
    subtitle:
      "Cast your vote for the top 25 playoff eligible Football Championship Subdivision (FCS) football teams.",
  },
  {
    division: "d2",
    title: "Division II",
    subtitle: "Cast your vote for the top 25 Division II football teams.",
  },
  {
    division: "d3",
    title: "Division III",
    subtitle: "Cast your vote for the top 25 Division III football teams.",
  },
];

export default async function VotePage({
  params,
}: PageProps<"/vote/college/[sport]/[division]">) {
  return draftAwareParamsPage(params, null, renderVotePage);
}

async function renderVotePage(
  resolved: { sport: string; division: string },
  { perspective, stega }: DynamicFetchOptions,
) {
  "use cache";
  const validationResult = ParamsSchema.safeParse(resolved);
  if (!validationResult.success) {
    notFound();
  }

  const { sport, division } = validationResult.data;

  const { data: schools } = await sanityFetchPage({
    query: schoolsBySportAndSubgroupingStringQuery,
    params: { sport, subgrouping: division },
    perspective,
    stega,
  });

  if (!schools) {
    notFound();
  }

  return (
    <Suspense>
      <VotePageAuth sport={sport} division={division} schools={schools} />
    </Suspense>
  );
}

async function VotePageAuth({
  sport,
  division,
  schools,
}: {
  sport: SportParam;
  division: string;
  schools: NonNullable<SchoolsBySportAndSubgroupingStringQueryResult>;
}) {
  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const sportId = await getSportIdBySlug(sport);

  const [votingWeek, { year }] = await Promise.all([
    getCurrentWeek(sport),
    getCurrentSeason(sport),
  ]);

  const hasVoted = await hasVoterVoted({
    year,
    week: votingWeek,
    division,
    sportId: sportId || "",
    userId,
  });

  if (hasVoted) {
    redirect(`/vote/college/${sport}/${division}/confirmation`);
  }

  const latestBallot = await getLatestVoterBallotWithSchools(
    userId,
    division,
    sport,
    year,
  );
  const header = divisionHeader.find((d) => d.division === division);
  const { title, subtitle } = header || { title: "", subtitle: "" };

  return (
    <div className="container">
      {title && subtitle && (
        <div className="space-y-4 pt-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>
      )}
      <VoteFormWrapper schools={schools} previousBallot={latestBallot} />
    </div>
  );
}
