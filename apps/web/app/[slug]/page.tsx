import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  queryPostPaths,
  queryPostSlugData,
} from "@redshirt-sports/sanity/queries";
import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import { badgeVariants } from "@redshirt-sports/ui/components/badge";
import { CameraIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toPlainText } from "next-sanity";

import ArticleCard from "@/components/article-card";
import ArticleLoadingSkeleton from "@/components/article-loading-skeleton";
import FormatDate from "@/components/format-date";
import { buildSafeImageUrl, PostPageJsonLd } from "@/components/json-ld";
import { LargeArticleSocialShare } from "@/components/posts/article-share";
import { AuthorSection, MobileAuthorSection } from "@/components/posts/author";
import { RichText } from "@/components/rich-text";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { getArticleTagNames } from "@/lib/article-seo";
import { WORDS_PER_MINUTE } from "@/lib/constants";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getCollegeSportSection } from "@/lib/sport-section";

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
    notFound();
  }

  const plainText = toPlainText(data.body);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const articleTags = getArticleTagNames(data.tags);

  return getPageMetadata(
    {
      ogType: "article",
      seoTitle: data.seoTitle ?? undefined,
      seoDescription: data.seoDescription ?? undefined,
      ogTitle: data.ogTitle ?? undefined,
      ogDescription: data.ogDescription ?? undefined,
      seoImage: data.seoImage ?? undefined,
      image: data.image ?? undefined,
      authors: data.authors,
      title: data.title,
      description: data.excerpt ?? undefined,
      slug: data.slug ?? undefined,
      readingTime: Math.ceil(wordCount / WORDS_PER_MINUTE),
      articleSection: getCollegeSportSection(data.sport),
      articleTags,
      publishedTime: data.publishedAt ?? undefined,
      modifiedTime: data._updatedAt ?? undefined,
    },
    perspective,
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
  const [{ data }, settings] = await Promise.all([
    sanityFetchPage({
      query: queryPostSlugData,
      params: { slug },
      perspective,
      stega,
    }) as Promise<{ data: QueryPostSlugDataResult | null }>,
    fetchGlobalSeoSettings(perspective),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <>
      <PostPageJsonLd
        article={data}
        publisher={{
          siteBrand: settings?.siteBrand,
          logo: buildSafeImageUrl(settings?.logo),
        }}
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
            {data.sport &&
              (data.division || data.sportSubgrouping || data.conferences) && (
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
                <LargeArticleSocialShare slug={slug} title={data.title} />
              </div>
              <MobileAuthorSection authors={data.authors} />
            </div>
            <article className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              {data.image && (
                <figure className="mb-8 space-y-1.5">
                  <CustomImage
                    image={data.image}
                    width={1200}
                    height={675}
                    className="h-auto w-full rounded-lg"
                    priority
                    mode="cover"
                    sizes={IMAGE_SIZES.articleHero}
                  />
                  <figcaption className="text-muted-foreground flex items-center gap-2 text-sm">
                    <CameraIcon className="h-4 w-4" />
                    <span>Source: {data.image.credit}</span>
                  </figcaption>
                </figure>
              )}
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
                  image={morePost.image}
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
