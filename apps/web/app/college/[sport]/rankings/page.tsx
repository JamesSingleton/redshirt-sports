import { PUBLISHED_FETCH_OPTIONS } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import {
  DivisionTop25Card,
  DivisionTop25CardSkeleton,
  FOOTBALL_POLL_DIVISIONS,
} from "@/components/rankings/top25-card";
import { SuspenseReveal } from "@/components/suspense-reveal";
import { getPageMetadata } from "@/lib/global-seo-settings";

type Params = { sport: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { sport } = await params;

  return getPageMetadata(
    {
      title: "College Football Top 25 Rankings",
      description:
        "The latest Redshirt Sports Top 25 polls for FCS, FBS, Division II and Division III college football.",
      slug: `/college/${sport}/rankings`,
    },
    PUBLISHED_FETCH_OPTIONS.perspective,
  );
}

function RankingsIndexGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="container grid gap-6 py-8 pb-12 md:grid-cols-2">
      {children}
    </div>
  );
}

const gridFallback = (
  <RankingsIndexGrid>
    {FOOTBALL_POLL_DIVISIONS.map((entry) => (
      <DivisionTop25CardSkeleton key={entry.slug} />
    ))}
  </RankingsIndexGrid>
);

async function RankingsIndex({ params }: { params: Promise<Params> }) {
  const { sport } = await params;
  if (sport !== "football") {
    notFound();
  }

  return (
    <RankingsIndexGrid>
      {FOOTBALL_POLL_DIVISIONS.map((entry) => (
        <SuspenseReveal
          key={entry.slug}
          fallback={<DivisionTop25CardSkeleton />}
        >
          <DivisionTop25Card division={entry.slug} />
        </SuspenseReveal>
      ))}
    </RankingsIndexGrid>
  );
}

/** Top 10 of every division's latest poll, each linking to the full Top 25. */
export default function RankingsIndexPage({
  params,
}: {
  params: Promise<Params>;
}) {
  return (
    <PageTransition>
      <PageHeader
        title="Top 25 Rankings"
        subtitle="The latest Redshirt Sports polls. Pick a division to see the full Top 25 and how every voter ranked it."
        breadcrumbs={[
          { title: "Rankings", href: "/college/football/rankings" },
        ]}
      />
      <Suspense fallback={gridFallback}>
        <RankingsIndex params={params} />
      </Suspense>
    </PageTransition>
  );
}
