import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import { sportInfoBySlug } from "@redshirt-sports/sanity/queries";
import { BookOpen, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ad-slot";
import { JsonLdScript } from "@/components/json-ld";
import { RankingsIndexPollCard } from "@/components/rankings/rankings-index-poll-card";
import { loadAdvertisement } from "@/lib/advertisement";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { buildIndexedPageJsonLd } from "@/lib/page-json-ld";
import { loadRankingsIndexCards } from "@/lib/rankings/read-model";
import { rankingsMethodologyHref } from "@/lib/rankings-nav";
import { sportNavLabel } from "@/lib/sport-nav";
import { validateSport } from "@/lib/vote-ballot";
import type { SportParam } from "@/utils/espn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport: sportSlug } = await params;
  const sport = validateSport(sportSlug);
  if (!sport) {
    notFound();
  }
  const { perspective } = PUBLISHED_FETCH_OPTIONS;

  const { data: sportData } = await sanityFetchMetadata({
    query: sportInfoBySlug,
    params: { slug: sport },
    perspective,
  });

  if (!sportData?.title) {
    notFound();
  }

  const sportLabel = sportNavLabel(sport, sportData.title);

  return getPageMetadata(
    {
      title: `${sportLabel} Rankings`,
      description: `Every Redshirt Sports poll for ${sportLabel}. Each poll is voted by a public panel; every ballot is published with the poll.`,
      slug: `/college/${sport}/rankings`,
    },
    perspective,
  );
}

export default async function SportRankingsIndexPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  return draftAwareParamsPage(params, null, renderSportRankingsIndex);
}

async function renderSportRankingsIndex(
  { sport: sportSlug }: { sport: string },
  { perspective, stega }: DynamicFetchOptions,
) {
  const sport = validateSport(sportSlug) as SportParam | null;
  if (!sport) {
    notFound();
  }

  const { data: sportData } = await sanityFetchMetadata({
    query: sportInfoBySlug,
    params: { slug: sport },
    perspective,
  });

  if (!sportData?.title) {
    notFound();
  }

  const sportLabel = sportNavLabel(sport, sportData.title);
  const [cards, advertisement] = await Promise.all([
    loadRankingsIndexCards(sport),
    loadAdvertisement({
      placement: "rankings-index-sidebar",
      sportSlugs: [sport],
      fetchOptions: { perspective, stega },
    }),
  ]);

  return (
    <>
      <JsonLdScript
        id={`rankings-index-${sport}`}
        data={buildIndexedPageJsonLd({
          pageType: "CollectionPage",
          name: `${sportLabel} Rankings`,
          description: `Every Redshirt Sports poll for ${sportLabel}. Each poll is voted by a public panel; every ballot is published with the poll.`,
          path: `/college/${sport}/rankings`,
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "College", path: "/college/news" },
            { name: sportLabel, path: `/college/${sport}/news` },
            { name: "Rankings", path: `/college/${sport}/rankings` },
          ],
          items: cards.map((card) => ({
            name: card.title,
            path: card.poll.weekHref,
          })),
        })}
      />
      <div className="mx-auto max-w-site px-4 pb-12 lg:px-6">
        <div className="pt-5">
          <nav
            className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              href="/college/news"
              className="hover:text-foreground"
              prefetch={false}
            >
              College
            </Link>
            <ChevronRight className="size-3 shrink-0" aria-hidden />
            <Link
              href={`/college/${sport}/news`}
              className="hover:text-foreground"
              prefetch={false}
            >
              {sportLabel.replace(/^College /, "")}
            </Link>
            <ChevronRight className="size-3 shrink-0" aria-hidden />
            <span className="text-foreground">Rankings</span>
          </nav>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="kicker text-primary">{sportLabel}</div>
              <h1 className="font-display text-[2.3rem] font-extrabold uppercase leading-none lg:text-headline-lg">
                Rankings
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Every Redshirt Sports poll for this sport. Each poll is voted by
                a public panel; every ballot is published with the poll.
              </p>
            </div>
            <Link
              href={rankingsMethodologyHref()}
              className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent"
              prefetch={false}
            >
              <BookOpen className="size-4" aria-hidden />
              How our polls work
            </Link>
          </div>
        </div>
        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid content-start gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <RankingsIndexPollCard key={card.division} card={card} />
            ))}
          </div>
          <aside className="grid content-start gap-6" aria-label="Sidebar">
            <AdSlot
              placement="rankings-index-sidebar"
              creative={advertisement}
              className="w-full max-w-[300px]"
            />
          </aside>
        </div>
      </div>
    </>
  );
}
