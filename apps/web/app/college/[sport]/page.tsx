import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  querySportHubData,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import HomePageSkeleton from "@/components/home/home-page-skeleton";
import { Megaboard } from "@/components/home/megaboard";
import {
  FeatureSection,
  GridSection,
  type HomeArticle,
  LeadListSection,
  SplitSection,
} from "@/components/home/sections";
import { FilterRow } from "@/components/news/filter-row";
import PageHeader from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { PollAside } from "@/components/rankings/poll-aside";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";

const SECTION_ARTICLES = 5;

/** Rotated so neighbouring divisions never share a layout. */
const SECTION_LAYOUTS = [
  FeatureSection,
  SplitSection,
  LeadListSection,
  GridSection,
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string }>;
}): Promise<Metadata> {
  const { sport } = await params;
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  const { data } = await sanityFetchMetadata({
    query: sportInfoBySlug,
    params: { slug: sport },
    perspective,
  });

  if (!data?.title) {
    notFound();
  }

  return getPageMetadata(
    {
      title: `College ${data.title} News, Rankings & Analysis`,
      description: `The latest college ${data.title.toLowerCase()} news, analysis and rankings from every division, from ${process.env.NEXT_PUBLIC_APP_NAME}.`,
      slug: `/college/${sport}`,
    },
    perspective,
  );
}

export default function SportHubPage({
  params,
}: {
  params: Promise<{ sport: string }>;
}) {
  return draftAwareParamsPage(params, <HomePageSkeleton />, renderSportHub);
}

/**
 * Not cached itself: the Sanity hub data and the Postgres-backed poll card
 * are sibling cache scopes.
 */
async function renderSportHub(
  { sport }: { sport: string },
  options: DynamicFetchOptions,
) {
  const data = await getCachedSportHubData(sport, options);

  if (!data?.sport || data.latest.length === 0) {
    notFound();
  }

  return <SportHubView data={data} aside={<PollAside sport={sport} />} />;
}

async function getCachedSportHubData(
  sport: string,
  { perspective, stega }: DynamicFetchOptions,
) {
  "use cache";
  const { data } = await sanityFetchPage({
    query: querySportHubData,
    params: { sport },
    perspective,
    stega,
  });
  return data;
}

type HubData = Awaited<ReturnType<typeof getCachedSportHubData>>;

function SportHubView({
  data,
  aside,
}: {
  data: HubData;
  aside: React.ReactNode;
}) {
  const sport = data.sport;
  if (!sport) return null;

  const sportPath = `/college/${sport.slug}`;
  const shown = new Set(data.latest.map((post) => post._id));
  const sections = data.groups.flatMap((group) => {
    const articles = group.posts
      .filter((post) => !shown.has(post._id))
      .slice(0, SECTION_ARTICLES);
    if (articles.length === 0) return [];
    for (const post of articles) shown.add(post._id);
    return [{ ...group, articles }];
  });

  return (
    <PageTransition>
      <PageHeader
        title={`College ${sport.title}`}
        breadcrumbs={[{ title: sport.title, href: sportPath }]}
      >
        <FilterRow
          label={`${sport.title} news by division`}
          items={[
            { key: "all", label: "All news", href: `${sportPath}/news` },
            ...data.groups.map((group) => ({
              key: group._id,
              label: group.shortName ?? group.name ?? "",
              href: `${sportPath}/news/${group.slug}`,
            })),
          ]}
        />
      </PageHeader>
      <div className="container flex flex-col gap-8 pb-12">
        <Megaboard
          articles={data.latest as HomeArticle[]}
          leadHeadingLevel="h2"
        />
        <div className="group/listing grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-10 lg:col-span-8 lg:group-has-[>aside:empty]/listing:col-span-12">
            {sections.map((section, index) => {
              const Section = SECTION_LAYOUTS[index % SECTION_LAYOUTS.length]!;
              return (
                <Section
                  key={section._id}
                  id={`section-${section.slug}`}
                  title={`${section.shortName} ${sport.title?.toLowerCase()}`}
                  description={
                    section.name !== section.shortName
                      ? (section.name ?? undefined)
                      : undefined
                  }
                  href={`${sportPath}/news/${section.slug}`}
                  articles={section.articles as HomeArticle[]}
                />
              );
            })}
          </div>
          <aside className="flex flex-col gap-6 empty:hidden lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
            {aside}
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}
