import {
  type DynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  queryPostPaths,
  queryPostSlugData,
} from "@redshirt-sports/sanity/queries";
import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toPlainText } from "next-sanity";

import { ArticleAside } from "@/components/article/article-aside";
import { ArticleByline } from "@/components/article/article-byline";
import { ArticleHeroImage } from "@/components/article/article-hero-image";
import {
  type ArticleTagLink,
  ArticleTags,
} from "@/components/article/article-tags";
import { FollowTeamCta } from "@/components/article/follow-team-cta";
import { UpNext } from "@/components/article/up-next";
import ArticleLoadingSkeleton from "@/components/article-loading-skeleton";
import { buildSafeImageUrl, PostPageJsonLd } from "@/components/json-ld";
import { BreadcrumbTrail } from "@/components/news/breadcrumb-trail";
import type { StoryLike } from "@/components/news/story";
import { RichText } from "@/components/rich-text";
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
  const { slug } = await params;
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
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

  const plainText = toPlainText(data.body);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

  const sportSlug = data.sport?.slug;
  const sportTitle = data.sport?.title;
  const usesSubgrouping = data.division?.name === "D1" && data.sportSubgrouping;
  const divisionSlug = usesSubgrouping
    ? data.sportSubgrouping?.slug
    : data.division?.slug;
  const divisionLabel = usesSubgrouping
    ? data.sportSubgrouping?.shortName
    : data.division?.name;

  const breadcrumbs = [
    sportSlug && sportTitle
      ? { title: sportTitle, href: `/college/${sportSlug}/news` }
      : null,
    sportSlug && divisionSlug && divisionLabel
      ? {
          title: divisionLabel,
          href: `/college/${sportSlug}/news/${divisionSlug}`,
        }
      : null,
  ].filter((crumb) => crumb !== null);

  const conferenceTags: ArticleTagLink[] =
    sportSlug && data.conferences
      ? data.conferences.map((conference) => {
          const matchingAffiliation =
            conference.sportSubdivisionAffiliations?.find(
              (affiliation) => affiliation.sport._id === data.sport?._id,
            );
          const divisionPathSegment =
            matchingAffiliation?.subgrouping.slug || conference.division.slug;

          return {
            label: conference.shortName ?? conference.name,
            href: `/college/${sportSlug}/news/${divisionPathSegment}/${conference.slug}`,
          };
        })
      : [];
  const topicTags: ArticleTagLink[] = (data.tags ?? []).map((tag) => ({
    label: tag.name,
  }));

  const kicker = [divisionLabel, sportTitle].filter(Boolean).join(" · ");
  const relatedStories = (data.relatedPosts ?? []) as StoryLike[];
  const [upNext, ...moreRelated] = relatedStories;
  const followName =
    data.teams?.[0]?.shortName ?? data.teams?.[0]?.name ?? sportTitle;

  return (
    <>
      <PostPageJsonLd
        article={data}
        publisher={{
          siteBrand: settings?.siteBrand,
          logo: buildSafeImageUrl(settings?.logo),
        }}
      />
      <div className="max-w-site mx-auto px-4 lg:px-6">
        <BreadcrumbTrail items={breadcrumbs} className="pt-5" />
        <div className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <article className="min-w-0">
            {kicker ? (
              <div className="kicker text-primary">{kicker}</div>
            ) : null}
            <h1
              id="article-title"
              className="font-display lg:text-headline-lg mt-2 max-w-4xl text-[2.4rem] leading-[0.98] font-extrabold uppercase"
            >
              {data.title}
            </h1>
            {data.excerpt ? (
              <p
                id="article-excerpt"
                className="text-muted-foreground mt-4 max-w-3xl font-serif text-xl"
              >
                {data.excerpt}
              </p>
            ) : null}
            <ArticleByline
              authors={data.authors ?? []}
              publishedAt={data.publishedAt}
              readingMinutes={readingMinutes}
              slug={slug}
              title={data.title}
            />
            {data.image ? (
              <ArticleHeroImage image={data.image} credit={data.image.credit} />
            ) : null}
            <div className="mx-auto mt-8 max-w-prose">
              <RichText
                richText={data.body}
                className="prose-headings:font-display prose-headings:font-bold prose-headings:uppercase prose-a:text-primary font-serif"
              />
              <ArticleTags tags={[...conferenceTags, ...topicTags]} />
              {followName ? <FollowTeamCta name={followName} /> : null}
            </div>
            {upNext ? <UpNext story={upNext} kicker={kicker} /> : null}
          </article>
          <ArticleAside
            sport={sportSlug}
            rankingsDivision={
              sportSlug === "football" ? (divisionSlug ?? "fcs") : null
            }
            relatedStories={moreRelated}
          />
        </div>
      </div>
    </>
  );
}
