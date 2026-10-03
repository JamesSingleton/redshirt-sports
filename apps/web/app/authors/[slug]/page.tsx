import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import { authorBySlug, postsByAuthor } from "@redshirt-sports/sanity/queries";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Graph } from "schema-dts";

import { Facebook, Twitter, YouTubeIcon } from "@/components/icons";
import {
  buildSafeImageUrl,
  JsonLdScript,
  organizationId,
  websiteId,
} from "@/components/json-ld";
import { NewsListing } from "@/components/news/news-listing";
import { SectionHeader } from "@/components/news/section-header";
import { PageTransition } from "@/components/page-transition";
import CustomImage from "@/components/sanity-image";
import { perPage } from "@/lib/constants";
import { searchParamsPage } from "@/lib/draft-cache";
import { getBaseUrl } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;
  const { perspective } = PUBLISHED_FETCH_OPTIONS;

  const { data: author } = await sanityFetchMetadata({
    query: authorBySlug,
    params: { slug },
    perspective,
  });

  if (!author) {
    notFound();
  }

  const roles = author.roles.join(", ");
  let canonical = `/authors/${slug}`;

  let title = `${author.name} - ${roles}`;
  let description = `Learn more about ${author.name}, ${roles} at ${process.env.NEXT_PUBLIC_APP_NAME}. Read their latest articles and get insights into their expertise in college football.`;

  if (page && typeof page === "string") {
    const pageNum = validatePageIndex(page);
    if (pageNum > 1) {
      canonical = `/authors/${slug}?page=${pageNum}`;
      title = `${author.name} - ${roles} (Page ${pageNum})`;
      description = `Page ${pageNum} of articles by ${author.name}, ${roles} at ${process.env.NEXT_PUBLIC_APP_NAME}. Discover their latest insights into college football.`;
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
  searchParams: Promise<{ page?: string }>;
}) {
  return searchParamsPage(null, () =>
    renderAuthorPage({ params, searchParams }),
  );
}

async function renderAuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const pageIndex = validatePageIndex(page);

  if (page && pageIndex === 1) {
    redirect(`/authors/${slug}`);
  }

  const { perspective, stega } = await getDynamicFetchOptions();
  return cachedRenderAuthorPage({ slug, pageIndex, perspective, stega });
}

async function cachedRenderAuthorPage({
  slug,
  pageIndex,
  perspective,
  stega,
}: DynamicFetchOptions & { slug: string; pageIndex: number }) {
  "use cache";
  const baseUrl = getBaseUrl();
  const from = (pageIndex - 1) * perPage;
  const to = pageIndex * perPage;

  const [{ data: author }, { data: authorPosts }] = await Promise.all([
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
  ]);

  if (!author) {
    notFound();
  }

  const authorJsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${baseUrl}/authors/${slug}#profile`,
        url: `${baseUrl}/authors/${slug}`,
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
              name: author.name,
              item: `${baseUrl}/authors/${slug}`,
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
          "@id": `${baseUrl}/authors/${slug}#image`,
          url: buildSafeImageUrl(author.image),
          width: "1200",
          height: "630",
          contentUrl: buildSafeImageUrl(author.image),
          caption: author.image.alt,
          inLanguage: "en-US",
        },
        mainEntity: {
          "@id": `${baseUrl}/authors/${slug}#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${baseUrl}/authors/${slug}#person`,
        name: author.name,
        url: `${baseUrl}/authors/${slug}`,
        description: author.biography || undefined,
        image: {
          "@type": "ImageObject",
          "@id": `${baseUrl}/authors/${slug}#image`,
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

  const socialLinks = [
    {
      url: author.socialLinks?.twitter,
      label: `Follow ${author.name} on X`,
      Icon: Twitter,
    },
    {
      url: author.socialLinks?.facebook,
      label: `Follow ${author.name} on Facebook`,
      Icon: Facebook,
    },
    {
      url: author.socialLinks?.youtube,
      label: `Subscribe to ${author.name} on YouTube`,
      Icon: YouTubeIcon,
    },
  ].filter((link): link is typeof link & { url: string } => Boolean(link.url));

  return (
    <PageTransition>
      <JsonLdScript
        data={authorJsonLd}
        id={`${author.name.toLowerCase().replace(/\s+/g, "-")}-json-ld`}
      />
      <header className="bg-card border-b">
        <div className="container flex flex-col gap-6 py-8 md:flex-row md:items-center md:py-10">
          <CustomImage
            image={author.image}
            className="size-24 shrink-0 rounded-full object-cover md:size-28"
            width={112}
            height={112}
            mode="cover"
          />
          <div className="flex max-w-3xl flex-col gap-3">
            <div className="flex flex-col gap-1">
              {author.roles.length > 0 ? (
                <p className="text-brand text-sm font-semibold">
                  {author.roles.join(", ")}
                </p>
              ) : null}
              <h1 className="headline text-4xl text-balance md:text-5xl">
                {author.name}
              </h1>
            </div>
            {author.biography ? (
              <p className="text-muted-foreground text-pretty md:text-lg">
                {author.biography}
              </p>
            ) : null}
            {socialLinks.length > 0 ? (
              <ul className="flex items-center gap-2">
                {socialLinks.map(({ url, label, Icon }) => (
                  <li key={url}>
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({
                        variant: "outline",
                        size: "icon",
                      })}
                    >
                      <Icon className="size-4 fill-current" />
                      <span className="sr-only">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </header>
      <section
        aria-labelledby="author-articles"
        className="container flex flex-col gap-6 py-8 pb-12"
      >
        <SectionHeader
          id="author-articles"
          title={`Stories by ${author.name}`}
        />
        {authorPosts && authorPosts.posts.length > 0 ? (
          <NewsListing.Grid
            posts={authorPosts.posts}
            totalPosts={authorPosts.totalPosts}
          />
        ) : (
          <p className="text-muted-foreground">No published stories yet.</p>
        )}
      </section>
    </PageTransition>
  );
}
