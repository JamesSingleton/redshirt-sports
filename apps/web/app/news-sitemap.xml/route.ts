import {
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import { newsSitemapQuery } from "@redshirt-sports/sanity/queries";
import { NextResponse } from "next/server";

import { getBaseUrl } from "@/lib/get-base-url";

type NewsSitemapPost = {
  _id: string;
  title: string;
  publishedAt: string;
  slug: string;
};

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] as string);
}

/**
 * Google News sitemap: the articles published in the last two days, in the
 * `news:` format Google uses to find articles for Top Stories and Google
 * News. Older articles stay in /college/news/sitemap/0.xml.
 */
export function buildNewsSitemap(
  posts: NewsSitemapPost[],
  baseUrl: string,
  publicationName: string,
) {
  const urls = posts
    .map(
      (post) => `  <url>
    <loc>${escapeXml(`${baseUrl}/${post.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(publicationName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(post.publishedAt)}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;
}

export async function GET() {
  const { data } = await sanityFetchMetadata({
    query: newsSitemapQuery,
    perspective: PUBLISHED_FETCH_OPTIONS.perspective,
  });
  const posts = (data ?? []) as NewsSitemapPost[];

  return new NextResponse(
    buildNewsSitemap(
      posts,
      getBaseUrl(),
      process.env.NEXT_PUBLIC_APP_NAME || "Redshirt Sports",
    ),
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Short: Google polls news sitemaps often, and new articles should
        // appear within minutes of publishing.
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
