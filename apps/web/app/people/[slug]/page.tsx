import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import { authorBySlug, postsByAuthor } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { Graph } from "schema-dts";

import {
  buildSafeImageUrl,
  JsonLdScript,
  organizationId,
  websiteId,
} from "@/components/json-ld";
import { PersonPageContent } from "@/components/people/person-page-content";
import { perPage } from "@/lib/constants";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import { personHref } from "@/lib/person-href";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;
  const { perspective } = await getDynamicFetchOptions();

  const { data: author } = await sanityFetchMetadata({
    query: authorBySlug,
    params: { slug },
    perspective,
  });

  if (!author) {
    notFound();
  }

  const roles = author.roles.join(", ");
  let canonical = personHref(slug);

  let title = `${author.name} - ${roles}`;
  let description = `Read articles by ${author.name}, ${roles} at ${process.env.NEXT_PUBLIC_APP_NAME}.`;

  if (page && typeof page === "string") {
    const pageNum = validatePageIndex(page);
    if (pageNum > 1) {
      canonical = `${personHref(slug)}?page=${pageNum}`;
      title = `${author.name} - ${roles} (Page ${pageNum})`;
      description = `Page ${pageNum} of articles by ${author.name}, ${roles} at ${process.env.NEXT_PUBLIC_APP_NAME}.`;
    }
  }

  return getPageMetadata(
    {
      title: title,
      description: description,
      slug: canonical,
      image: author.image,
      ogType: "profile",
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  return draftAwareParamsPage(params, null, async ({ slug }, options) => {
    const { page } = await searchParams;
    const pageIndex = validatePageIndex(page);

    if (page && typeof page === "string" && pageIndex === 1) {
      redirect(personHref(slug));
    }

    return cachedRenderPersonPage({ slug, pageIndex, ...options });
  });
}

async function cachedRenderPersonPage({
  slug,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { slug: string; pageIndex: number }) {
  const baseUrl = getBaseUrl();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;
  const profileUrl = `${baseUrl}${personHref(slug)}`;

  const [{ data: author }, { data: authorPosts }, mostRead] = await Promise.all(
    [
      sanityFetchPage({
        query: authorBySlug,
        params: { slug },
        perspective,
        stega,
      }),
      sanityFetchPage({
        query: postsByAuthor,
        params: { slug, from, to },
        perspective,
        stega,
      }),
      getCachedMostReadPosts({ perspective, stega }),
    ],
  );

  if (!author) {
    notFound();
  }

  const totalPosts = authorPosts?.totalPosts ?? 0;
  const posts = authorPosts?.posts ?? [];

  const authorJsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${profileUrl}#profile`,
        url: profileUrl,
        name: author.name,
        description: author.biography || undefined,
        breadcrumb: {
          "@type": "BreadcrumbList",
          name: `${author.name} breadcrumbs`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${baseUrl}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "About",
              item: `${baseUrl}/about`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: author.name,
              item: profileUrl,
            },
          ],
        },
        inLanguage: "en-US",
        isPartOf: {
          "@type": "WebSite",
          "@id": websiteId,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          "@id": `${profileUrl}#image`,
          url: buildSafeImageUrl(author.image),
          width: "1200",
          height: "630",
          contentUrl: buildSafeImageUrl(author.image),
          caption: author.image.alt,
          inLanguage: "en-US",
        },
        mainEntity: {
          "@id": `${profileUrl}#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${profileUrl}#person`,
        name: author.name,
        url: profileUrl,
        description: author.biography || undefined,
        image: {
          "@type": "ImageObject",
          "@id": `${profileUrl}#image`,
          url: buildSafeImageUrl(author.image),
          width: "1200",
          height: "630",
          contentUrl: buildSafeImageUrl(author.image),
          caption: author.image.alt,
          inLanguage: "en-US",
        },
        jobTitle: author.roles.join(", "),
        knowsAbout: author.roles,
        sameAs: [...Object.values(author?.socialLinks || {})].filter(Boolean),
        worksFor: {
          "@type": "Organization",
          "@id": organizationId,
        },
      },
    ],
  };

  return (
    <>
      <JsonLdScript
        data={authorJsonLd}
        id={`${author.name.toLowerCase().replace(/\s+/g, "-")}-json-ld`}
      />
      <PersonPageContent
        author={{
          name: author.name,
          slug: author.slug,
          roles: author.roles,
          biography: author.biography,
          image: author.image,
          socialLinks: author.socialLinks,
        }}
        posts={posts
          .filter(
            (post): post is typeof post & { slug: string } =>
              typeof post.slug === "string" && post.slug.length > 0,
          )
          .map((post) => ({
            _id: post._id,
            title: post.title,
            slug: post.slug,
            publishedAt: post.publishedAt,
            image: post.image,
            sport:
              post.sport &&
              typeof post.sport === "object" &&
              "slug" in post.sport
                ? {
                    slug: (post.sport as { slug?: string | null }).slug ?? null,
                    title:
                      (post.sport as { title?: string | null }).title ?? null,
                  }
                : null,
            division:
              post.division && typeof post.division === "object"
                ? {
                    name:
                      (post.division as { name?: string | null }).name ?? null,
                  }
                : null,
            sportSubgrouping:
              post.sportSubgrouping && typeof post.sportSubgrouping === "object"
                ? {
                    shortName:
                      (post.sportSubgrouping as { shortName?: string | null })
                        .shortName ?? null,
                    name:
                      (post.sportSubgrouping as { name?: string | null })
                        .name ?? null,
                  }
                : null,
            tags: Array.isArray(post.tags)
              ? post.tags.map((tag) =>
                  typeof tag === "object" && tag && "name" in tag
                    ? { name: (tag as { name?: string | null }).name ?? null }
                    : { name: null },
                )
              : null,
            storyType: post.storyType ?? null,
          }))}
        totalPosts={totalPosts}
        pageIndex={pageIndex}
        mostRead={mostRead}
      />
    </>
  );
}
