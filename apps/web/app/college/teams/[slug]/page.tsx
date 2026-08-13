import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  MIN_TEAM_PAGE_POSTS,
  postsBySchoolAndStoryTypeQuery,
  postsBySchoolQuery,
  querySchoolPaths,
  schoolBySlugQuery,
  schoolSlugsByIdsQuery,
} from "@redshirt-sports/sanity/queries";
import type {
  PostsBySchoolAndStoryTypeQueryResult,
  PostsBySchoolQueryResult,
  SchoolBySlugQueryResult,
  SchoolSlugsByIdsQueryResult,
} from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TeamPageJsonLd } from "@/components/json-ld";
import CustomImage from "@/components/sanity-image";
import { TeamConnectWidget } from "@/components/teams/team-connect-widget";
import { TeamFeedList } from "@/components/teams/team-feed-list";
import {
  TeamFeaturedArticle,
  TeamNewsItem,
} from "@/components/teams/team-post-card";
import { TeamRankingHistory } from "@/components/teams/team-ranking-history";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import {
  getCachedRankedSchoolSanityIds,
  getCachedSchoolHasPollRankings,
  getCachedSchoolRankingHistory,
} from "@/lib/rankings-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { isTeamPageEligible } from "@/lib/team-page-eligibility";

function defaultTeamPageTitle({
  name,
  shortName,
  nickname,
}: {
  name: string;
  shortName: string | null;
  nickname: string | null;
}) {
  const teamName = [shortName ?? name, nickname].filter(Boolean).join(" ");

  return `${teamName} Sports Coverage, Recruiting News & Updates`;
}

function defaultTeamPageDescription(schoolName: string) {
  return `Your source for ${schoolName} news, recruiting updates, transfer portal coverage, game previews, recaps, analysis, and more.`;
}

export async function generateStaticParams() {
  const [{ data: postQualified }, rankedSanityIds] = await Promise.all([
    sanityFetchStaticParams({
      query: querySchoolPaths,
      params: { minPosts: MIN_TEAM_PAGE_POSTS },
    }),
    getCachedRankedSchoolSanityIds(),
  ]);

  const rankedSlugs =
    rankedSanityIds.length > 0
      ? ((
          await sanityFetchStaticParams({
            query: schoolSlugsByIdsQuery,
            params: { ids: rankedSanityIds },
          })
        ).data as SchoolSlugsByIdsQueryResult | null)
      : [];

  const slugs = new Set<string>();
  for (const school of postQualified ?? []) {
    if (school.slug) slugs.add(school.slug);
  }
  for (const school of rankedSlugs ?? []) {
    if (school.slug) slugs.add(school.slug);
  }

  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const [{ slug }, { perspective }] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const { data: school } = (await sanityFetchMetadata({
    query: schoolBySlugQuery,
    params: { slug },
    perspective,
  })) as { data: SchoolBySlugQueryResult | null };

  if (!school) {
    notFound();
  }

  const hasRankings = await getCachedSchoolHasPollRankings(school._id);
  if (
    !isTeamPageEligible({
      postCount: school.postCount,
      hasRankings,
    })
  ) {
    notFound();
  }

  return getPageMetadata(
    {
      title: school.seoTitle ?? defaultTeamPageTitle(school),
      description:
        school.seoDescription ??
        school.overview ??
        defaultTeamPageDescription(school.name),
      seoImage: school.seoImage ?? undefined,
      image: school.image ?? undefined,
      slug: `/college/teams/${slug}`,
      ogTitle: school.ogTitle ?? undefined,
      ogDescription: school.ogDescription ?? undefined,
    },
    perspective,
  );
}

export default async function SchoolTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return draftAwareParamsPage(params, null, renderSchoolTeamPage);
}

async function renderSchoolTeamPage(
  { slug }: { slug: string },
  { perspective, stega }: DynamicFetchOptions,
) {
  "use cache";
  const { data: school } = (await sanityFetchPage({
    query: schoolBySlugQuery,
    params: { slug },
    perspective,
    stega,
  })) as { data: SchoolBySlugQueryResult | null };

  if (!school) {
    notFound();
  }

  const [
    { data: newsData },
    { data: recruitingPosts },
    globalSettings,
    rankingHistory,
  ] = await Promise.all([
    sanityFetchPage({
      query: postsBySchoolQuery,
      params: { schoolId: school._id, from: 0, to: MIN_TEAM_PAGE_POSTS },
      perspective,
      stega,
    }) as Promise<{ data: PostsBySchoolQueryResult | null }>,
    sanityFetchPage({
      query: postsBySchoolAndStoryTypeQuery,
      params: { schoolId: school._id, storyType: "recruiting" },
      perspective,
      stega,
    }) as Promise<{ data: PostsBySchoolAndStoryTypeQueryResult | null }>,
    fetchGlobalSeoSettings(perspective),
    getCachedSchoolRankingHistory(school._id),
  ]);

  if (
    !isTeamPageEligible({
      postCount: school.postCount,
      hasRankings: rankingHistory.polls.length > 0,
    })
  ) {
    notFound();
  }

  const posts = newsData?.posts ?? [];
  const featuredPosts = posts.slice(0, 3);
  const sportsPosts = posts.slice(3, 8);

  const teamShortName = school.shortName ?? school.name ?? "Team";

  const sportsFooterLinks = [
    { label: "View All Football", href: "/college/football/news" },
    { label: "View All Basketball", href: "/college/mens-basketball/news" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TeamPageJsonLd school={school} />
      <TeamNavBar
        teamName={school.shortName ?? school.name ?? "Team"}
        schoolImage={school.image}
      />

      <div className="mx-auto grid max-w-437.5 grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:p-6">
        <section className="min-w-0">
          {featuredPosts.length > 0 ? (
            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {featuredPosts.map((post) => (
                <TeamFeaturedArticle key={post._id} post={post} />
              ))}
            </section>
          ) : null}

          <TeamFeedList
            title={`${teamShortName} Sports`}
            posts={sportsPosts}
            footerLinks={sportsFooterLinks}
          />

          <TeamRankingHistory
            history={rankingHistory}
            teamName={teamShortName}
          />

          {recruitingPosts && recruitingPosts.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-5 text-[22px] font-bold text-foreground">
                {teamShortName} Recruiting
              </h2>
              <ul className="flex flex-col gap-5">
                {recruitingPosts.map((post) => (
                  <li key={post._id}>
                    <TeamNewsItem post={post} />
                  </li>
                ))}
              </ul>
              <footer className="mt-5 flex flex-wrap gap-6">
                <Link
                  href="/recruiting"
                  className="text-xs font-bold tracking-wide text-destructive-foreground uppercase hover:underline"
                >
                  View All Recruiting
                </Link>
                <Link
                  href="/transfer-portal"
                  className="text-xs font-bold tracking-wide text-destructive-foreground uppercase hover:underline"
                >
                  View All Transfers
                </Link>
              </footer>
            </section>
          ) : null}
        </section>

        <aside className="hidden min-w-0 lg:block">
          {/* <NilWidget teamShortName={teamShortName} /> */}
          <TeamConnectWidget
            schoolName={teamShortName}
            schoolSocialLinks={school.socialLinks}
            globalSocialLinks={globalSettings?.socialLinks}
          />
          {/* <CommitmentsWidget teamShortName={teamShortName} /> */}
        </aside>
      </div>
    </div>
  );
}

function TeamNavBar({
  teamName,
  schoolImage,
}: {
  teamName: string;
  schoolImage: NonNullable<SchoolBySlugQueryResult>["image"];
}) {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-437.5 items-center gap-4 overflow-x-auto px-4 [-webkit-overflow-scrolling:touch]">
        <div className="flex shrink-0 items-center gap-2.5">
          {schoolImage ? (
            <CustomImage
              image={schoolImage}
              width={28}
              height={28}
              className="flex size-7 shrink-0 items-center justify-center"
            />
          ) : (
            <div className="size-7 shrink-0 rounded-full bg-muted" />
          )}
          <h1 className="text-sm font-bold tracking-wide whitespace-nowrap">
            {teamName}
          </h1>
        </div>
      </div>
    </nav>
  );
}
