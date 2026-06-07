import { queryPostPaths, queryPostSlugData } from "@redshirt-sports/sanity/queries";
import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { badgeVariants } from "@redshirt-sports/ui/components/badge";
import { CameraIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toPlainText } from "next-sanity";
import type { WebPage, WithContext } from "schema-dts";

import ArticleCard from "@/components/article-card";
import ArticleLoadingSkeleton from "@/components/article-loading-skeleton";
import FormatDate from "@/components/format-date";
import {
  ArticleJsonLd,
  buildSafeImageUrl,
  JsonLdScript,
  websiteId,
} from "@/components/json-ld";
import { LargeArticleSocialShare } from "@/components/posts/article-share";
import { AuthorSection, MobileAuthorSection } from "@/components/posts/author";
import { RichText } from "@/components/rich-text";
import CustomImage from "@/components/sanity-image";
import { WORDS_PER_MINUTE } from "@/lib/constants";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import { getBaseUrl } from "@/lib/get-base-url";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getSEOMetadata } from "@/lib/seo";

const baseUrl = getBaseUrl();

const STORY_TYPE_LABELS: Record<string, string> = {
  news: "News",
  recruiting: "Recruiting",
  transfer: "Transfer Portal",
  analysis: "Analysis",
  opinion: "Opinion",
  "game-recap": "Game Recap",
};

export async function generateStaticParams() {
  const { data } = await sanityFetchStaticParams({
    query: queryPostPaths,
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
  const { data } = (await sanityFetchMetadata({
    query: queryPostSlugData,
    params: { slug },
    perspective,
  })) as { data: QueryPostSlugDataResult | null };

  if (!data) {
    return {};
  }

  const plainText = toPlainText(data.body);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  const settings = await fetchGlobalSeoSettings(perspective);

  return getSEOMetadata({
    ogType: "article",
    seoTitle: data.seoTitle ?? undefined,
    seoDescription: data.seoDescription ?? undefined,
    ogTitle: data.ogTitle ?? undefined,
    ogDescription: data.ogDescription ?? undefined,
    seoImage: data.seoImage ?? undefined,
    image: data.mainImage ?? undefined,
    authors: data.authors,
    title: data.title,
    description: data.excerpt ?? undefined,
    slug: data.slug,
    readingTime: Math.ceil(wordCount / WORDS_PER_MINUTE),
    articleSection: data.storyType,
    defaultOpenGraphImage: settings?.defaultOpenGraphImage ?? undefined,
    siteBrand: settings?.siteBrand ?? undefined,
  });
}

export default async function PostPage({ params }: PageProps<"/[slug]">) {
  return draftAwareParamsPage(
    params,
    <ArticleLoadingSkeleton />,
    renderPostPage,
  );
}

async function renderPostPage(
  { slug }: { slug: string },
  { perspective, stega }: DynamicFetchOptions,
) {
  "use cache";
  const { data } = (await sanityFetchPage({
    query: queryPostSlugData,
    params: { slug },
    perspective,
    stega,
  })) as { data: QueryPostSlugDataResult | null };

  if (!data) {
    notFound();
  }

  const articleUrl = `${baseUrl}/${data.slug}`;
  const imageId = `${articleUrl}#primaryImage`;
  const articleImageUrl = buildSafeImageUrl(data.mainImage);

  const webPageJsonLd: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": articleUrl,
    url: articleUrl,
    name: `${data.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    isPartOf: { "@id": websiteId },
    primaryImageOfPage: {
      "@type": "ImageObject",
      "@id": imageId,
      url: articleImageUrl,
      contentUrl: articleImageUrl,
      caption: data.mainImage.alt,
      width: "1920",
      height: "1080",
    },
    thumbnailUrl: articleImageUrl,
    datePublished: data.publishedAt,
    dateModified: data._updatedAt,
    description: data.excerpt,
    breadcrumb: {
      "@type": "BreadcrumbList",
      "@id": `${articleUrl}#breadcrumb`,
      name: `${data.title} breadcrumbs`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: data.title,
          item: articleUrl,
        },
      ],
    },
    inLanguage: "en-US",
    potentialAction: [
      {
        "@type": "ReadAction",
        target: [articleUrl],
      },
    ],
  };

  return (
    <>
      <ArticleJsonLd article={data} />
      <JsonLdScript
        data={webPageJsonLd}
        id={`article-webpage-json-ld-${data.slug}`}
      />
      <section className="mt-8 pb-8">
        <div className="container">
          <h1
            id="article-title"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl"
          >
            {data.title}
          </h1>
          <p
            id="article-excerpt"
            className="mt-4 text-lg font-normal lg:text-xl"
          >
            {data.excerpt}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {data.storyType && data.storyType !== "news" && (
              <span className={badgeVariants({ variant: "secondary" })}>
                {STORY_TYPE_LABELS[data.storyType] ?? data.storyType}
              </span>
            )}
            {data.teams?.map((team) =>
              team.slug ? (
                <Link
                  key={team._id}
                  href={`/college/teams/${team.slug}`}
                  className={badgeVariants({ variant: "outline" })}
                  prefetch={false}
                >
                  {team.shortName ?? team.name}
                </Link>
              ) : null,
            )}
            {data.sport &&
              (data.division ||
                data.sportSubgrouping ||
                data.conferences) && (
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/college/${data.sport.slug}/news`}
                    className={badgeVariants({ variant: "default" })}
                    prefetch={false}
                  >
                    {data.sport.title}
                  </Link>

                  {data.division && (
                    <Link
                      href={`/college/${data.sport.slug}/news/${
                        data.division.name === "D1" && data.sportSubgrouping
                          ? data.sportSubgrouping.slug
                          : data.division.slug
                      }`}
                      className={badgeVariants({ variant: "default" })}
                      prefetch={false}
                    >
                      {data.division.name === "D1" && data.sportSubgrouping
                        ? data.sportSubgrouping.shortName
                        : data.division.name}
                    </Link>
                  )}

                  {data.sport &&
                    data.conferences?.map((conference) => {
                      const articleSportId = data.sport?._id;

                      const matchingAffiliation =
                        conference.sportSubdivisionAffiliations?.find(
                          (affiliation) =>
                            affiliation.sport._id === articleSportId,
                        );

                      const divisionPathSegment =
                        matchingAffiliation?.subgrouping.slug ||
                        conference.division.slug;

                      const conferenceHref = `/college/${data.sport?.slug}/news/${divisionPathSegment}/${conference.slug}`;

                      return (
                        <Link
                          key={conference.slug}
                          href={conferenceHref}
                          className={badgeVariants({ variant: "default" })}
                          prefetch={false}
                        >
                          {conference.shortName ?? conference.name}
                        </Link>
                      );
                    })}
                </div>
              )}

            {data.sport && (data.division || data.conferences) && (
              <span className="text-sm">•</span>
            )}
            {data.publishedAt && <FormatDate dateString={data.publishedAt} />}
          </div>
        </div>
      </section>
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="container">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-20 xl:gap-24">
            <div className="lg:w-64 lg:shrink-0">
              <div className="hidden lg:sticky lg:top-24 lg:left-0 lg:flex lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:self-start">
                <AuthorSection authors={data.authors} />
                <LargeArticleSocialShare
                  slug={data.slug}
                  title={data.title}
                />
              </div>
              <MobileAuthorSection authors={data.authors} />
            </div>
            <article className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              <figure className="mb-8 space-y-1.5">
                <CustomImage
                  image={data.mainImage}
                  width={1600}
                  height={900}
                  className="h-auto w-full rounded-lg"
                  loading="eager"
                />
                <figcaption className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CameraIcon className="h-4 w-4" />
                  <span>Source: {data.mainImage.credit}</span>
                </figcaption>
              </figure>
              <RichText richText={data.body} />
            </article>
          </div>
        </div>
      </section>
      {data.relatedPosts.length > 0 && (
        <section className="border-border border-y py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                You Might Also Like
              </h2>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
              {data.relatedPosts.map((morePost: any) => (
                <ArticleCard
                  key={morePost._id}
                  title={morePost.title}
                  date={morePost.publishedAt}
                  image={morePost.mainImage}
                  slug={morePost.slug}
                  author={morePost.authors[0].name}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
