import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  postsBySchoolAndStoryTypeQuery,
  postsBySchoolQuery,
  querySchoolPaths,
  schoolBySlugQuery,
} from "@redshirt-sports/sanity/queries";
import type {
  PostsBySchoolAndStoryTypeQueryResult,
  PostsBySchoolQueryResult,
  SchoolBySlugQueryResult,
} from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { Separator } from "@redshirt-sports/ui/components/separator";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import CustomImage from "@/components/sanity-image";
import { TeamConnectWidget } from "@/components/teams/team-connect-widget";
import { TeamFeedList } from "@/components/teams/team-feed-list";
import { TeamPlayerSearch } from "@/components/teams/team-player-search";
import {
  TeamFeaturedArticle,
  TeamNewsItem,
} from "@/components/teams/team-post-card";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import { getBaseUrl } from "@/lib/get-base-url";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getSEOMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const { data } = await sanityFetchStaticParams({
    query: querySchoolPaths,
  });
  return data?.map(({ slug }) => ({ slug })) ?? [];
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
  const [{ data }, settings] = await Promise.all([
    sanityFetchMetadata({
      query: schoolBySlugQuery,
      params: { slug },
      perspective,
    }),
    fetchGlobalSeoSettings(perspective),
  ]);

  if (!data) return {};

  return getSEOMetadata({
    title:
      data.seoTitle ??
      `${data.shortName ?? data.name} ${data.nickname ?? ""}`.trim(),
    description:
      data.seoDescription ??
      data.overview ??
      `Latest news, recruiting, and transfer coverage for ${data.name}.`,
    seoImage: data.seoImage ?? undefined,
    image: data.image ?? undefined,
    slug: `/college/teams/${slug}`,
    ogTitle: data.ogTitle ?? undefined,
    ogDescription: data.ogDescription ?? undefined,
    defaultOpenGraphImage: settings?.defaultOpenGraphImage ?? undefined,
    siteBrand: settings?.siteBrand ?? undefined,
  });
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

  const [{ data: newsData }, { data: recruitingPosts }, globalSettings] =
    await Promise.all([
      sanityFetchPage({
        query: postsBySchoolQuery,
        params: { schoolId: school._id, from: 0, to: 8 },
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
    ]);

  const posts = newsData?.posts ?? [];
  const featuredPosts = posts.slice(0, 3);
  const sportsPosts = posts.slice(3, 8);

  const teamShortName = school.shortName ?? school.name ?? "Team";
  const baseUrl = getBaseUrl();
  const teamUrl = `${baseUrl}/college/teams/${slug}`;

  const sportsFooterLinks = [
    { label: "View All Football", href: "/college/football/news" },
    { label: "View All Basketball", href: "/college/mens-basketball/news" },
  ];

  return (
    <div className="bg-background">
      <TeamNavBar
        teamName={school.shortName ?? school.name ?? "Team"}
        schoolImage={school.image}
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-[1fr_300px]">
        <section className="min-w-0">
          {featuredPosts.length > 0 ? (
            <section className="mb-10 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
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

          {recruitingPosts && recruitingPosts.length > 0 ? (
            <section className="mb-10">
              <header className="mb-5 border-b border-border pb-3">
                <h2 className="text-xl font-bold tracking-tight">
                  {teamShortName} Recruiting
                </h2>
              </header>
              <ul className="flex flex-col">
                {recruitingPosts.map((post, index) => (
                  <li key={post._id}>
                    <TeamNewsItem post={post} />
                    {index < recruitingPosts.length - 1 ? <Separator /> : null}
                  </li>
                ))}
              </ul>
              <footer className="mt-5 flex flex-wrap gap-6 border-t border-border pt-4">
                <Button variant="link" asChild className="h-auto p-0">
                  <Link href="/recruiting">View All Recruiting</Link>
                </Button>
                <Button variant="link" asChild className="h-auto p-0">
                  <Link href="/transfer-portal">View All Transfers</Link>
                </Button>
              </footer>
            </section>
          ) : null}
        </section>

        <aside className="min-w-0">
          {/* <NilWidget teamShortName={teamShortName} /> */}
          <TeamConnectWidget
            schoolName={teamShortName}
            schoolSocialLinks={school.socialLinks}
            globalSocialLinks={globalSettings?.socialLinks}
          />
          {/* <CommitmentsWidget teamShortName={teamShortName} /> */}
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: school.name,
            url: teamUrl,
            sport: school.conferenceAffiliations
              ?.map((a) => a.sport?.title)
              .filter(Boolean),
          }),
        }}
      />
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
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          {schoolImage ? (
            <CustomImage
              image={schoolImage}
              width={40}
              height={40}
              className="size-10 shrink-0"
            />
          ) : (
            <div className="size-10 shrink-0 rounded-full bg-muted" />
          )}
          <h1 className="text-lg font-bold tracking-tight">{teamName}</h1>
        </div>
      </div>
    </nav>
  );
}

function NilWidget({ teamShortName }: { teamShortName: string }) {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
        <CardTitle className="text-base">{teamShortName} NIL 100</CardTitle>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Coming Soon
        </span>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-sm text-muted-foreground">
          NIL rankings for {teamShortName} athletes will be available here.
        </p>
      </CardContent>
      <CardFooter className="border-t px-4 pt-4">
        <Button variant="link" asChild className="h-auto p-0">
          <Link href="#">View Full NIL 100</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function CommitmentsWidget({ teamShortName }: { teamShortName: string }) {
  return (
    <Card className="mt-6 gap-4 py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">{teamShortName} Commitments</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="text-sm text-muted-foreground">
          Recruiting commitments for {teamShortName} will be displayed here.
        </p>
      </CardContent>
      <CardFooter className="border-t px-4 pt-4">
        <Button variant="link" asChild className="h-auto p-0">
          <Link href="/recruiting">View All Commitments</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
