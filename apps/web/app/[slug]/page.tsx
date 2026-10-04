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
import { CameraIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toPlainText } from "next-sanity";

import { ArticleImage, ArticleRow } from "@/components/article-card";
import ArticleLoadingSkeleton from "@/components/article-loading-skeleton";
import FormatDate from "@/components/format-date";
import { buildSafeImageUrl, PostPageJsonLd } from "@/components/json-ld";
import { PageTransition } from "@/components/page-transition";
import { ArticleShare } from "@/components/posts/article-share";
import { Byline } from "@/components/posts/author";
import {
  DivisionTop25Card,
  DivisionTop25CardSkeleton,
  isPollDivision,
} from "@/components/rankings/top25-card";
import { RichText } from "@/components/rich-text";
import { SidebarCard } from "@/components/sidebar-card";
import { SuspenseReveal } from "@/components/suspense-reveal";
import { getArticleTagNames } from "@/lib/article-seo";
import { WORDS_PER_MINUTE } from "@/lib/constants";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { IMAGE_SIZES } from "@/lib/image-sizes";
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

type Post = NonNullable<QueryPostSlugDataResult>;

/**
 * Not cached itself: the Sanity article and the Postgres-backed Top 25 card
 * are sibling cache scopes.
 */
async function renderPostPage(
  params: { slug: string },
  options: DynamicFetchOptions,
) {
  const { data, settings } = await getCachedPostPageData(params, options);

  if (!data) {
    notFound();
  }

  const pollDivision = getPollDivision(data);

  return (
    <PostPageView
      post={data}
      slug={params.slug}
      publisher={{
        siteBrand: settings?.siteBrand,
        logo: buildSafeImageUrl(settings?.logo),
      }}
      top25={
        pollDivision ? (
          <SuspenseReveal fallback={<DivisionTop25CardSkeleton />}>
            <DivisionTop25Card division={pollDivision} />
          </SuspenseReveal>
        ) : null
      }
    />
  );
}

/** Only football articles in a division we publish a poll for get a poll card. */
function getPollDivision(post: Post) {
  const { sport, division, sportSubgrouping } = post;
  if (sport?.slug !== "football" || !division) return null;
  const slug =
    division.name === "D1" && sportSubgrouping
      ? sportSubgrouping.slug
      : division.slug;
  return slug && isPollDivision(slug) ? slug : null;
}

async function getCachedPostPageData(
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
  return { data, settings };
}

/** Division I news only exists per subgrouping (FBS, FCS, …), never at `/news/d1`. */
function isDivisionOne(division: {
  name?: string | null;
  slug?: string | null;
}) {
  const name = division.name?.toLowerCase();
  const slug = division.slug?.toLowerCase();
  return (
    name === "d1" ||
    name === "division i" ||
    slug === "d1" ||
    slug === "division-i"
  );
}

function getTopicLinks(post: Post) {
  const { sport, division, sportSubgrouping, conferences } = post;
  if (!sport) return [];

  const links: { key: string; label: string; href: string }[] = [
    {
      key: "sport",
      label: sport.title,
      href: `/college/${sport.slug}/news`,
    },
  ];

  if (division) {
    if (!isDivisionOne(division)) {
      links.push({
        key: "division",
        label: division.name,
        href: `/college/${sport.slug}/news/${division.slug}`,
      });
    } else if (sportSubgrouping) {
      links.push({
        key: "division",
        label: sportSubgrouping.shortName ?? sportSubgrouping.name,
        href: `/college/${sport.slug}/news/${sportSubgrouping.slug}`,
      });
    }
  }

  for (const conference of conferences ?? []) {
    const affiliation = conference.sportSubdivisionAffiliations?.find(
      (item) => item.sport._id === sport._id,
    );
    if (!affiliation?.subgrouping.slug && isDivisionOne(conference.division)) {
      continue;
    }
    const divisionSegment =
      affiliation?.subgrouping.slug || conference.division.slug;
    links.push({
      key: `conference-${conference.slug}`,
      label: conference.shortName ?? conference.name,
      href: `/college/${sport.slug}/news/${divisionSegment}/${conference.slug}`,
    });
  }

  return links;
}

function PostPageView({
  post,
  slug,
  publisher,
  top25,
}: {
  post: Post;
  slug: string;
  publisher: { siteBrand?: string | null; logo?: string | null };
  top25: React.ReactNode;
}) {
  const topics = getTopicLinks(post);

  return (
    <PageTransition>
      <PostPageJsonLd article={post} publisher={publisher} />
      <div className="container grid gap-10 py-6 md:py-10 lg:grid-cols-[minmax(0,48rem)_minmax(20rem,28rem)] lg:justify-between xl:gap-14">
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:mx-0 lg:max-w-none">
          <header className="flex flex-col gap-4">
            {topics.length > 0 ? (
              <nav aria-label="Article topics">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                  {topics.map((topic) => (
                    <li key={topic.key}>
                      <Link
                        href={topic.href as Route}
                        prefetch={false}
                        className="text-primary hover:underline"
                      >
                        {topic.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            <h1
              id="article-title"
              className="headline text-4xl text-balance md:text-5xl"
            >
              {post.title}
            </h1>
            {post.excerpt ? (
              <p
                id="article-excerpt"
                className="text-muted-foreground text-lg text-pretty md:text-xl"
              >
                {post.excerpt}
              </p>
            ) : null}
            <div className="border-border flex flex-wrap items-center justify-between gap-4 border-y py-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Byline authors={post.authors} />
                {post.publishedAt ? (
                  <FormatDate
                    dateString={post.publishedAt}
                    className="text-muted-foreground text-sm"
                  />
                ) : null}
              </div>
              <ArticleShare slug={slug} title={post.title} />
            </div>
          </header>

          {post.image ? (
            <figure className="flex flex-col gap-2">
              <ArticleImage
                id={post._id}
                image={post.image}
                priority
                sizes={IMAGE_SIZES.articleHero}
                width={1280}
                height={720}
              />
              {post.image.credit ? (
                <figcaption className="text-muted-foreground flex items-center gap-2 text-xs">
                  <CameraIcon aria-hidden="true" className="size-3.5" />
                  {post.image.credit}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <RichText richText={post.body} />
        </article>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          {post.relatedPosts.length > 0 ? (
            <SidebarCard.Root labelledBy="related-heading">
              <SidebarCard.Header
                id="related-heading"
                title="Articles you may like"
              />
              <ul className="divide-y">
                {post.relatedPosts.map((related) => (
                  <li key={related._id} className="px-4 py-3">
                    <ArticleRow
                      id={related._id}
                      title={related.title}
                      image={related.image}
                      slug={related.slug}
                      date={related.publishedAt}
                    />
                  </li>
                ))}
              </ul>
            </SidebarCard.Root>
          ) : null}
          {top25}
        </aside>
      </div>
    </PageTransition>
  );
}
