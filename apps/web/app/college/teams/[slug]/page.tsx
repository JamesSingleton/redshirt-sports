import {
  postsBySchoolAndStoryTypeQuery,
  postsBySchoolQuery,
  schoolBySlugQuery,
} from "@redshirt-sports/sanity/queries";
import { badgeVariants } from "@redshirt-sports/ui/components/badge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleCard from "@/components/article-card";
import CustomImage from "@/components/sanity-image";
import { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import { getBaseUrl } from "@/lib/get-base-url";
import { getSEOMetadata } from "@/lib/seo";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchPage,
} from "@/lib/sanity-fetch";

export const revalidate = 604800;

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
    fetchGlobalSeoSettings(),
  ]);

  if (!data) return {};

  return getSEOMetadata({
    title: data.seoTitle ?? `${data.shortName ?? data.name} ${data.nickname ?? ""}`.trim(),
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
  const [{ slug }, fetchOptions] = await Promise.all([
    params,
    getDynamicFetchOptions(),
  ]);
  const { data: school } = await sanityFetchPage({
    query: schoolBySlugQuery,
    params: { slug },
    ...fetchOptions,
  });

  if (!school) {
    notFound();
  }

  const [{ data: newsData }, { data: recruitingPosts }, { data: transferPosts }] =
    await Promise.all([
      sanityFetchPage({
        query: postsBySchoolQuery,
        params: { schoolId: school._id, from: 0, to: 8 },
        ...fetchOptions,
      }),
      sanityFetchPage({
        query: postsBySchoolAndStoryTypeQuery,
        params: { schoolId: school._id, storyType: "recruiting" },
        ...fetchOptions,
      }),
      sanityFetchPage({
        query: postsBySchoolAndStoryTypeQuery,
        params: { schoolId: school._id, storyType: "transfer" },
        ...fetchOptions,
      }),
    ]);

  const baseUrl = getBaseUrl();
  const teamUrl = `${baseUrl}/college/teams/${slug}`;

  return (
    <div className="container py-10">
      <header className="flex flex-col gap-6 border-b pb-10 md:flex-row md:items-start md:gap-10">
        {school.image && (
          <CustomImage
            image={school.image}
            width={120}
            height={120}
            className="h-24 w-24 rounded-lg object-contain"
          />
        )}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {school.shortName ?? school.name}
            {school.nickname ? ` ${school.nickname}` : ""}
          </h1>
          {school.overview && (
            <p className="text-muted-foreground max-w-3xl text-lg">
              {school.overview}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {school.conferenceAffiliations?.map((affiliation) => (
              <span
                key={affiliation._key}
                className={badgeVariants({ variant: "secondary" })}
              >
                {affiliation.sport?.title}: {affiliation.conference?.shortName ?? affiliation.conference?.name}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {school.websiteUrl && (
              <a
                href={school.websiteUrl}
                className="underline underline-offset-2"
                target="_blank"
                rel="noreferrer noopener"
              >
                Athletics website
              </a>
            )}
            {school.socialLinks?.twitter && (
              <a href={school.socialLinks.twitter} className="underline underline-offset-2" target="_blank" rel="noreferrer noopener">
                X / Twitter
              </a>
            )}
            {school.socialLinks?.instagram && (
              <a href={school.socialLinks.instagram} className="underline underline-offset-2" target="_blank" rel="noreferrer noopener">
                Instagram
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Latest News</h2>
          <Link href="/college/news" className="text-sm underline underline-offset-2">
            All college news
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {newsData?.posts?.map((post) => (
            <ArticleCard
              key={post._id}
              title={post.title}
              image={post.mainImage}
              slug={post.slug}
              author={post.authors?.[0]?.name ?? "Redshirt Sports"}
              date={post.publishedAt}
            />
          ))}
        </div>
      </section>

      {recruitingPosts && recruitingPosts.length > 0 && (
        <section className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recruiting News</h2>
            <Link href="/recruiting" className="text-sm underline underline-offset-2">
              Recruiting hub
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {recruitingPosts.map((post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                image={post.mainImage}
                slug={post.slug}
                author={post.authors?.[0]?.name ?? "Redshirt Sports"}
                date={post.publishedAt}
              />
            ))}
          </div>
        </section>
      )}

      {transferPosts && transferPosts.length > 0 && (
        <section className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Transfer Portal News</h2>
            <Link href="/transfer-portal" className="text-sm underline underline-offset-2">
              Transfer portal hub
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {transferPosts.map((post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                image={post.mainImage}
                slug={post.slug}
                author={post.authors?.[0]?.name ?? "Redshirt Sports"}
                date={post.publishedAt}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-lg font-semibold">Latest Commitments</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Player commitment data will appear here once the recruiting database is populated.
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: school.name,
            url: teamUrl,
            sport: school.conferenceAffiliations?.map((a) => a.sport?.title).filter(Boolean),
          }),
        }}
      />
    </div>
  );
}
