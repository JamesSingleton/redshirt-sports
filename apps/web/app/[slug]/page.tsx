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
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toPlainText } from "next-sanity";

import { ArticlePageContent } from "@/components/article/article-page-content";
import { buildSafeImageUrl, PostPageJsonLd } from "@/components/json-ld";
import { DirectionalPageTransition } from "@/components/view-transitions/directional-page-transition";
import { loadAdvertisement } from "@/lib/advertisement";
import { getArticleTagNames } from "@/lib/article-seo";
import { WORDS_PER_MINUTE } from "@/lib/constants";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { getCachedRankingsWidgetPolls } from "@/lib/rankings-widget-data";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getCollegeSportSection } from "@/lib/sport-section";
import { validateSport } from "@/lib/vote-ballot";

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
  const { perspective } = await getDynamicFetchOptions();
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
  return draftAwareParamsPage(params, null, renderPostPage, {
    prerenderPublished: true,
  });
}

async function renderPostPage(
  { slug }: { slug: string },
  { perspective, stega }: DynamicFetchOptions,
) {
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
  const readingTimeMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  const sportSlug = data.sport?.slug;
  const [rankingsPolls, advertisement] = await Promise.all([
    sportSlug
      ? getCachedRankingsWidgetPolls(validateSport(sportSlug))
      : Promise.resolve([]),
    loadAdvertisement({
      placement: "article-sidebar",
      sportSlugs: sportSlug ? [sportSlug] : [],
      fetchOptions: { perspective, stega },
    }),
  ]);

  return (
    <DirectionalPageTransition>
      <PostPageJsonLd
        article={data}
        publisher={{
          siteBrand: settings?.siteBrand,
          logo: buildSafeImageUrl(settings?.logo),
        }}
      />
      <ArticlePageContent
        post={data}
        slug={slug}
        readingTimeMinutes={readingTimeMinutes}
        rankingsPolls={rankingsPolls}
        advertisement={advertisement}
      />
    </DirectionalPageTransition>
  );
}
