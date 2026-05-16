import { sanityFetch } from "@redshirt-sports/sanity/live";
import { queryPostSlugData } from "@redshirt-sports/sanity/queries";
import { CameraIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toPlainText } from "next-sanity";
import { Suspense } from "react";
import type { WebPage, WithContext } from "schema-dts";

import ArticleCard from "@/components/article-card";
import ArticleLoadingSkeleton from "@/components/article-loading-skeleton";
import { DivisionBadge } from "@/components/division-badge";
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
import { SectionHeader } from "@/components/section-header";
import { WORDS_PER_MINUTE } from "@/lib/constants";
import { getBaseUrl } from "@/lib/get-base-url";
import { getSEOMetadata } from "@/lib/seo";

// cache page for a week
export const revalidate = 604800;
export const dynamic = "force-static";

const baseUrl = getBaseUrl();

async function fetchPostSlugData(slug: string) {
  return await sanityFetch({
    query: queryPostSlugData,
    params: { slug },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await fetchPostSlugData(slug);

  if (!data) {
    return {};
  }

  const plainText = toPlainText(data.body);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  return getSEOMetadata({
    ogType: "article",
    image: data.mainImage,
    authors: data.authors,
    title: data.title,
    description: data.excerpt,
    slug: data.slug,
    readingTime: Math.ceil(wordCount / WORDS_PER_MINUTE),
  });
}

export default async function PostPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const { data } = await fetchPostSlugData(slug);

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
      <Suspense fallback={<ArticleLoadingSkeleton />}>
        <section className="mt-8 pb-8">
          <div className="container">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {data.sport && data.division && (
                <DivisionBadge 
                  division={
                    data.division.name === "D1" && data.sportSubgrouping
                      ? data.sportSubgrouping.slug
                      : data.division.slug
                  } 
                  size="md" 
                />
              )}
              {data.sport && (
                <Link
                  href={`/college/${data.sport.slug}/news`}
                  className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide"
                  prefetch={false}
                >
                  {data.sport.title}
                </Link>
              )}
              {data.conferences?.map((conference) => {
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
                    className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide"
                    prefetch={false}
                  >
                    {conference.shortName ?? conference.name}
                  </Link>
                );
              })}
            </div>
            <h1
              id="article-title"
              className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-balance"
            >
              {data.title}
            </h1>
            <p
              id="article-excerpt"
              className="mt-4 text-lg text-muted-foreground lg:text-xl"
            >
              {data.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
          <section className="border-t border-border py-12 sm:py-16 lg:py-20">
            <div className="container">
              <SectionHeader title="You Might Also Like" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
      </Suspense>
    </>
  );
}
