import type { Metadata } from "next";
import Link from "next/link";

import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import { getPageMetadata } from "@/lib/global-seo-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  return getPageMetadata(
    {
      title: `${division.toUpperCase()} poll voters`,
      description: `The voter roster for the ${division.toUpperCase()} Redshirt Sports poll.`,
      slug: `/college/${sport}/rankings/${division}/voters`,
    },
    "published",
  );
}

export default async function VotersPage({
  params,
}: {
  params: Promise<{ sport: string; division: string }>;
}) {
  const { sport, division } = await params;

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">
        Redshirt Sports Poll · {division.toUpperCase()}
      </div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        Voters
      </h1>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
        The published poll is the average of eligible voter ballots. Individual
        ballots, outlets, and disclosures live on each week&apos;s ballot
        pages.
      </p>
      <RankingsTabs sport={sport} division={division} active="voters" />
      <div className="mt-8 max-w-prose space-y-4 text-sm leading-relaxed">
        <p>
          Voters are independent journalists and analysts covering{" "}
          {division.toUpperCase()} college football. A ballot counts only when
          it is submitted inside the voting window.
        </p>
        <p>
          Open a week&apos;s poll to see every ballot side by side, or browse
          ballots grouped by voter.
        </p>
        <Link
          href={`/college/${sport}/rankings/${division}`}
          className="text-primary font-medium hover:underline"
          prefetch={false}
        >
          Latest poll
        </Link>
      </div>
    </div>
  );
}
