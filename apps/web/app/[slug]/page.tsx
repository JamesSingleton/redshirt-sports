import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
  sanityFetchStaticParams,
} from "@redshirt-sports/sanity/live";
import {
  queryPostPaths,
  queryPostSlugMetadata,
  queryPostSlugPage,
} from "@redshirt-sports/sanity/queries";
import type {
  QueryPostSlugMetadataResult,
  QueryPostSlugPageResult,
} from "@redshirt-sports/sanity/types";
import { Badge } from "@redshirt-sports/ui/components/badge";
import { CameraIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ArticleLoadingSkeleton from "@/components/article-loading-skeleton";
import {
  buildSafeImageUrl,
  type PostArticleJsonLdInput,
  PostPageJsonLd,
} from "@/components/json-ld";
import { ArticleByline } from "@/components/posts/article-byline";
import { RelatedArticlesSidebar } from "@/components/posts/related-articles-sidebar";
import { RichText } from "@/components/rich-text";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { getArticleCategoryBadge } from "@/lib/article-category-badge";
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
    query: queryPostSlugMetadata,
    params: { slug },
    perspective,
  })) as { data: QueryPostSlugMetadataResult | null };

  if (!data) {
    notFound();
  }

  const articleTags = getArticleTagNames(data.tags);

  return getPageMetadata(
    {
      ogType: "article",
      seoTitle: data.seoTitle ?? undefined,
      seoDescription: data.seoDescription ?? undefined,
      ogTitle: data.ogTitle ?? undefined,
      ogDescription: data.ogDescription ?? undefined,
      seoImage: data.seoImage
        ? {
            alt: data.seoImage.alt,
            asset: data.seoImage.asset ?? undefined,
          }
        : undefined,
      image: data.image
        ? {
            alt: data.image.alt,
            asset: data.image.asset ?? undefined,
          }
        : undefined,
      authors: data.authors.map((author) => ({
        name: author.name,
        socialLinks: author.socialLinks ?? undefined,
      })),
      title: data.title,
      description: data.excerpt ?? undefined,
      slug: data.slug ?? undefined,
      readingTime: Math.ceil(data.wordCount / WORDS_PER_MINUTE),
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
      query: queryPostSlugPage,
      params: { slug },
      perspective,
      stega,
    }) as Promise<{ data: QueryPostSlugPageResult | null }>,
    fetchGlobalSeoSettings(perspective),
  ]);

  if (!data) {
    notFound();
  }

  const categoryBadge = getArticleCategoryBadge(data.sport, data.storyType);
  const jsonLdArticle: PostArticleJsonLdInput = {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    publishedAt: data.publishedAt,
    _updatedAt: data._updatedAt,
    body: data.body,
    authors: data.authors,
    image: data.image,
    sport: data.sport,
    tags: data.tags,
  };

  return (
    <>
      <PostPageJsonLd
        article={jsonLdArticle}
        publisher={{
          siteBrand: settings?.siteBrand,
          logo: buildSafeImageUrl(settings?.logo),
        }}
      />
      <div className="container px-4 py-10 md:px-8">
        <article className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {categoryBadge ? (
              <div className="mb-4">
                {categoryBadge.href ? (
                  <Badge
                    variant="secondary"
                    className="text-xs uppercase tracking-widest"
                    render={<Link href={categoryBadge.href} prefetch={false} />}
                  >
                    {categoryBadge.label}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-xs uppercase tracking-widest"
                  >
                    {categoryBadge.label}
                  </Badge>
                )}
              </div>
            ) : null}

            <h1
              id="article-title"
              className="mb-6 text-3xl font-black text-balance text-foreground leading-tight md:text-4xl"
            >
              {data.title}
            </h1>

            <ArticleByline
              authors={data.authors}
              publishedAt={data.publishedAt}
              slug={slug}
              title={data.title}
            />

            {data.image ? (
              <figure className="mb-7">
                <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                  <CustomImage
                    image={data.image}
                    width={1200}
                    height={675}
                    className="h-full w-full object-cover"
                    priority
                    mode="cover"
                    sizes={IMAGE_SIZES.articleHero}
                  />
                </div>
                {data.image.credit ? (
                  <figcaption className="mt-2 flex items-center gap-2 px-1 text-muted-foreground text-sm">
                    <CameraIcon className="size-4" aria-hidden="true" />
                    <span>Source: {data.image.credit}</span>
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <RichText richText={data.body} />
          </div>

          <RelatedArticlesSidebar
            articles={data.relatedPosts}
            storyType={data.storyType}
            sportSlug={data.sport?.slug}
          />
        </article>
      </div>
    </>
  );
}
