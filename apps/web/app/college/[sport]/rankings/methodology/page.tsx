import type { Metadata } from "next";

import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import { getPageMetadata } from "@/lib/global-seo-settings";

const faqs = [
  {
    q: "How are points calculated?",
    a: "A first-place vote is worth 25 points, second place 24, down to 1 point for 25th. Teams are ordered by total points.",
  },
  {
    q: "What is a first-place vote?",
    a: "Each voter names one No. 1. The count of those votes is shown next to the team.",
  },
  {
    q: "Who can vote?",
    a: "Eligible voters are approved before the season. A ballot counts only if it is submitted during the open window.",
  },
  {
    q: "What is an outlier?",
    a: "A ranking that sits far from the rest of the panel is flagged so readers can see disagreement without changing the published order.",
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  return getPageMetadata(
    {
      title: "Rankings methodology",
      description:
        "How the Redshirt Sports poll awards points, counts ballots, and publishes the Top 25.",
      slug: `/college/${sport}/rankings/methodology`,
    },
    "published",
  );
}

export default async function MethodologyPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  const { sport } = await params;

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">Redshirt Sports Poll</div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        Methodology
      </h1>
      <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
        Points, first-place votes, eligibility, and how ballots become the
        published ranking.
      </p>
      <RankingsTabs sport={sport} division="fcs" active="methodology" />
      <div className="mt-8 max-w-prose space-y-8">
        <section>
          <h2 className="font-display text-2xl font-extrabold uppercase">
            Points
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Each ballot ranks 25 teams. First place earns 25 points and each
            spot below loses one point. The published Top 25 is the order of
            total points. Ties keep the same rank and the next rank is skipped.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold uppercase">
            Voting window
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Ballots open and close on a set window each week. Late ballots are
            not counted. The release notes how many ballots were included.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold uppercase">
            Transparency
          </h2>
          <p className="mt-2 text-sm leading-relaxed">
            Every counted ballot is public on the Ballots tab, including how
            closely it matched the final order. Others receiving votes and
            teams that dropped out are listed under the poll.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold uppercase">
            FAQ
          </h2>
          <dl className="mt-3 space-y-4">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="text-muted-foreground mt-1 text-sm">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
