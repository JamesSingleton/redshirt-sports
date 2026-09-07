import { auth } from "@redshirt-sports/auth/server";
import {
  arePollRankingsPublished,
  getLatestVoterBallot,
  getPollBySportAndSlug,
  getSportIdBySlug,
  getVoterBallots,
  hasVoterVoted,
  resolveWeekIdForLegacyWeek,
} from "@redshirt-sports/db/queries";
import { client } from "@redshirt-sports/sanity/client";
import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import {
  schoolsBySportAndSubgroupingStringQuery,
  schoolsForVotesQuery,
} from "@redshirt-sports/sanity/queries";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import z from "zod";

import VoteFormWrapper from "@/components/vote-form-wrapper";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { userCanVoteOnPoll } from "@/lib/require-poll-voter";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import {
  getCurrentSeason,
  getVotingWeek,
  type SportParam,
  SportSchema,
} from "@/utils/espn";

const ParamsSchema = z.object({
  sport: SportSchema,
  division: z.string(),
});

type VoterBallotWithSchool = {
  id: string;
  userId: string;
  division: string;
  week: number;
  year: number;
  createdAt: Date;
  teamId: string;
  rank: number;
  points: number;
  sportId?: string;
  schoolId?: string;
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
    subtitle: "Cast your vote for the top 25 Division II teams.",
  },
  {
    division: "d3",
    title: "Division III",
    subtitle: "Cast your vote for the top 25 Division III teams.",
  },
  {
    division: "power-conferences",
    title: "Power Conferences",
    subtitle:
      "Cast your vote for the top 25 Power Conference basketball teams.",
  },
  {
    division: "mid-major",
    title: "Mid-Major",
    subtitle: "Cast your vote for the top 25 Mid-Major basketball teams.",
  },
];

export default async function VotePage({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  return draftAwareParamsPage(params, null, (resolved, options) =>
    renderVotePage(resolved, options, searchParams),
  );
}

async function renderVotePage(
  resolved: { sport: string; division: string },
  options: DynamicFetchOptions,
  searchParams: Promise<{ edit?: string }>,
) {
  const validationResult = ParamsSchema.safeParse(resolved);
  if (!validationResult.success) {
    notFound();
  }

  const { sport, division } = validationResult.data;

  return (
    <Suspense>
      <VotePageAuth
        sport={sport}
        division={division}
        options={options}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

/** Exported for Vitest — wraps auth, poll access, and form render. */
export async function VotePageAuth({
  sport,
  division,
  options,
  searchParams,
}: {
  sport: SportParam;
  division: string;
  options: DynamicFetchOptions;
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { userId } = await auth.protect();

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) {
    notFound();
  }

  const canVote = await userCanVoteOnPoll({
    userId,
    sportId,
    pollSlug: division,
  });
  if (!canVote) {
    redirect("/");
  }

  const { data: schools } = await sanityFetchPage({
    query: schoolsBySportAndSubgroupingStringQuery,
    params: { sport, subgrouping: division },
    ...options,
  });

  if (!schools) {
    notFound();
  }

  const [votingWeek, { year }, query] = await Promise.all([
    getVotingWeek(sport),
    getCurrentSeason(sport),
    searchParams ?? Promise.resolve({} as { edit?: string }),
  ]);
  const wantsEdit = query.edit === "1";

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  const weekId = poll
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

  const hasVoted = await hasVoterVoted({
    year,
    week: votingWeek,
    division,
    sportId,
    userId,
  });

  if (hasVoted && (!wantsEdit || published)) {
    redirect(`/vote/college/${sport}/${division}/confirmation`);
  }

  const header = divisionHeader.find((d) => d.division === division);
  const { title, subtitle } = header || { title: "", subtitle: "" };

  if (!hasVoted && published) {
    return (
      <div className="container flex flex-col items-center gap-6 py-12 text-center">
        {title ? (
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
        ) : null}
        <p className="text-muted-foreground text-lg">
          Voting is closed for this week. Rankings have already been published.
        </p>
        <Link href="/" className={buttonVariants()}>
          Return Home
        </Link>
      </div>
    );
  }

  const currentBallot = hasVoted
    ? await getVoterBallots({
        userId,
        division,
        sportId,
        year,
        week: votingWeek,
      })
    : [];
  const latestBallot = hasVoted
    ? []
    : await getLatestVoterBallotWithSchools(userId, division, sport, year);

  return (
    <div className="container">
      {title && subtitle && (
        <div className="flex flex-col gap-4 pt-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>
      )}
      <VoteFormWrapper
        schools={schools}
        previousBallot={latestBallot}
        currentBallot={currentBallot}
        mode={hasVoted ? "edit" : "create"}
      />
    </div>
  );
}
