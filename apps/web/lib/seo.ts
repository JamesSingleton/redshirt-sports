import { urlFor } from "@redshirt-sports/sanity/client";
import type { Metadata } from "next";

import { getBaseUrl } from "./get-base-url";

interface MetaDataInput {
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
}

function buildPageUrl({ baseUrl, slug }: { baseUrl: string; slug: string }) {
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
  return `${baseUrl}${normalizedSlug}`;
}

function resolveImageUrl(
  image: MetaDataInput["image"],
  defaultOpenGraphImage?: string,
): string | undefined {
  if (image?.asset) {
    return urlFor(image).size(1200, 630).url();
  }

  return defaultOpenGraphImage;
}

export function getSEOMetadata(data: MetaDataInput = {}): Metadata {
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
  } = data ?? {};

  const baseUrl = getBaseUrl();
  const pageUrl = buildPageUrl({ baseUrl, slug });

  const twitterHandle = "@_redshirtsports";

  const authorTwitterHandle = authors?.[0]?.socialLinks?.twitter
    ? `@${authors[0]?.socialLinks?.twitter.split("/").pop()}`
    : twitterHandle;

  const metaTitle = seoTitle ?? ogTitle ?? title ?? "College Sports News & Analysis at All Levels";
  const metaDescription =
    seoDescription ??
    ogDescription ??
    description ??
    "Redshirt Sports is your go to resource for comprehensive college football and basketball coverage. Get in-depth analysis and insights across all NCAA divisions.";

  const brandName = siteBrand ?? "Redshirt Sports";
  const resolvedImage =
    resolveImageUrl(seoImage, defaultOpenGraphImage) ??
    resolveImageUrl(ogImage, defaultOpenGraphImage) ??
    resolveImageUrl(image, defaultOpenGraphImage);

  const imageAlt =
    seoImage?.alt ?? ogImage?.alt ?? image?.alt ?? brandName;

  return {
    title: `${metaTitle} | ${brandName}`,
    description: metaDescription,
    metadataBase: new URL(baseUrl),
    creator: brandName,
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
      images: resolvedImage ? [resolvedImage] : undefined,
      site: twitterHandle,
      creator: authorTwitterHandle,
      title: metaTitle,
      description: metaDescription,
    },
    alternates: {
      canonical: pageUrl,
      types: {
        "application/rss+xml": `${baseUrl}/api/rss/feed.xml`,
      },
    },
    openGraph: {
      type: ogType ?? "website",
      countryName: "en_US",
      description: metaDescription,
      title: metaTitle,
      url: pageUrl,
      siteName: brandName,
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
      ...(authors &&
        authors.length > 0 && {
          authors: authors.map((author) => author.name).filter(Boolean) as string[],
        }),
      ...(articleSection && { section: articleSection }),
    },
    robots: {
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
    },
    ...(readingTime !== undefined &&
      readingTime !== null && {
        other: {
          "twitter:label1": "Reading time",
          "twitter:data1": `${readingTime} minutes`,
        },
      }),
  };
}
