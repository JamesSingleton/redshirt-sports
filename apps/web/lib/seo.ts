import { urlFor } from "@redshirt-sports/sanity/client";
import type { Metadata } from "next";

import { getBaseUrl } from "./get-base-url";

export const SITE_BRAND = "Redshirt Sports";
export const DEFAULT_META_TITLE =
  "College Sports News & Analysis at All Levels";
export const DEFAULT_META_DESCRIPTION =
  "Redshirt Sports is your go to resource for comprehensive college football and basketball coverage. Get in-depth analysis and insights across all NCAA divisions.";
export const OG_LOCALE = "en_US";
export const OG_COUNTRY_NAME = "United States";

const TWITTER_HANDLE = "@_redshirtsports";

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export interface PageMetadataInput {
  _type?: string;
  _id?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  title?: string;
  description?: string;
  slug?: string;
  authors?: Array<{
    name?: string;
    socialLinks?: { twitter?: string };
  }>;
  ogType?: Extract<Metadata["openGraph"], { type: string }>["type"];
  image?: {
    alt?: string;
    asset?: { _ref?: string };
  };
  seoImage?: {
    alt?: string;
    asset?: { _ref?: string };
  };
  ogImage?: {
    alt?: string;
    asset?: { _ref?: string };
  };
  defaultOpenGraphImage?: string;
  siteBrand?: string;
  readingTime?: number;
  articleSection?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}

function buildPageUrl({ baseUrl, slug }: { baseUrl: string; slug: string }) {
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
  return `${baseUrl}${normalizedSlug}`;
}

function resolveImageUrl(
  image: PageMetadataInput["image"],
): string | undefined {
  if (image?.asset) {
    return urlFor(image).size(1200, 630).url();
  }

  return undefined;
}

function buildOpenGraphSiteDefaults(brandName: string) {
  return {
    siteName: brandName,
    locale: OG_LOCALE,
    countryName: OG_COUNTRY_NAME,
  };
}

const robotsDefaults: Metadata["robots"] = {
  index: true,
  follow: true,
  "max-image-preview": "large",
  "max-snippet": -1,
  "max-video-preview": -1,
  googleBot: {
    index: true,
    follow: true,
    noimageindex: false,
    "max-snippet": -1,
    "max-video-preview": -1,
    "max-image-preview": "large",
  },
};

/** Site-wide defaults merged into every page via the root layout. */
export function getRootMetadata(): Metadata {
  const baseUrl = getBaseUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: DEFAULT_META_TITLE,
      template: `%s | ${SITE_BRAND}`,
    },
    description: DEFAULT_META_DESCRIPTION,
    creator: SITE_BRAND,
    icons: {
      icon: [
        {
          url: "/icon1.png",
          sizes: "16x16",
        },
        {
          url: "/icon2.png",
          sizes: "32x32",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
    alternates: {
      types: {
        "application/rss+xml": `${baseUrl}/api/rss/feed.xml`,
      },
    },
    openGraph: {
      type: "website",
      ...buildOpenGraphSiteDefaults(SITE_BRAND),
      title: DEFAULT_META_TITLE,
      description: DEFAULT_META_DESCRIPTION,
      url: baseUrl,
    },
    robots: robotsDefaults,
  };
}

export function getSEOMetadata(data: PageMetadataInput = {}): Metadata {
  const {
    seoDescription,
    seoTitle,
    ogTitle,
    ogDescription,
    slug = "/",
    title,
    description,
    authors,
    ogType,
    image,
    seoImage,
    ogImage,
    defaultOpenGraphImage,
    siteBrand,
    readingTime,
    articleSection,
    publishedTime,
    modifiedTime,
    noIndex,
  } = data ?? {};

  const baseUrl = getBaseUrl();
  const pageUrl = buildPageUrl({ baseUrl, slug });

  const authorTwitterHandle = authors?.[0]?.socialLinks?.twitter
    ? `@${authors[0]?.socialLinks?.twitter.split("/").pop()}`
    : TWITTER_HANDLE;

  const metaTitle = seoTitle ?? ogTitle ?? title ?? DEFAULT_META_TITLE;
  const metaDescription =
    seoDescription ?? ogDescription ?? description ?? DEFAULT_META_DESCRIPTION;

  const brandName = siteBrand ?? SITE_BRAND;
  const fullTitle = `${metaTitle} | ${brandName}`;
  const resolvedImage =
    resolveImageUrl(seoImage) ??
    resolveImageUrl(ogImage) ??
    resolveImageUrl(image) ??
    defaultOpenGraphImage;

  const imageAlt = seoImage?.alt ?? ogImage?.alt ?? image?.alt ?? brandName;
  const resolvedOgType = ogType ?? "website";

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: pageUrl,
    },
    ...(noIndex && { robots: noIndexRobots }),
    twitter: {
      card: "summary_large_image",
      images: resolvedImage ? [resolvedImage] : undefined,
      site: TWITTER_HANDLE,
      creator: authorTwitterHandle,
      title: fullTitle,
      description: metaDescription,
    },
    openGraph: {
      type: resolvedOgType,
      ...buildOpenGraphSiteDefaults(brandName),
      description: metaDescription,
      title: fullTitle,
      url: pageUrl,
      images: resolvedImage
        ? [
            {
              url: resolvedImage,
              width: 1200,
              height: 630,
              alt: imageAlt,
              secureUrl: resolvedImage,
              type: "image/jpeg",
            },
          ]
        : undefined,
      ...(resolvedOgType === "article" && publishedTime
        ? { publishedTime }
        : undefined),
      ...(resolvedOgType === "article" && modifiedTime
        ? { modifiedTime }
        : undefined),
      ...(resolvedOgType === "article" &&
        authors &&
        authors.length > 0 && {
          authors: authors
            .map((author) => author.name)
            .filter(Boolean) as string[],
        }),
      ...(articleSection && { section: articleSection }),
    },
    ...(resolvedOgType === "article" &&
      (() => {
        const articleOtherMeta: Record<string, string | string[]> = {};
        const articleAuthorNames =
          authors
            ?.map((author) => author.name)
            .filter((name): name is string => Boolean(name)) ?? [];

        const firstAuthorName = articleAuthorNames[0];
        if (firstAuthorName) {
          articleOtherMeta["og:article:author"] =
            articleAuthorNames.length === 1
              ? firstAuthorName
              : articleAuthorNames;

          articleOtherMeta["twitter:label1"] = "Written by";
          articleOtherMeta["twitter:data1"] = firstAuthorName;
        }

        if (readingTime !== undefined && readingTime !== null) {
          articleOtherMeta["twitter:label2"] = "Est. reading time";
          articleOtherMeta["twitter:data2"] = `${readingTime} minutes`;
        }

        return Object.keys(articleOtherMeta).length > 0
          ? { other: articleOtherMeta }
          : {};
      })()),
  };
}
