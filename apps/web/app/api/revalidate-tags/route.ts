import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { safeCompare } from "@/lib/safe-compare";

const sanityRevalidateSecret = process.env.SANITY_REVALIDATE_SECRET;
const cacheRevalidateSecret = process.env.CACHE_REVALIDATE_SECRET;

/** Post-list tags from `@redshirt-sports/sanity/cache-tags`, sent by the `post-cache-tags` Sanity Function. */
function isPostListTag(tag: string) {
  return tag.startsWith("post:") || tag.startsWith("posts:");
}

function isAllowlistedCacheTag(tag: string) {
  return (
    isPostListTag(tag) ||
    tag === "rankings" ||
    tag.startsWith("rankings:") ||
    tag === "ratings" ||
    tag.startsWith("ratings:") ||
    tag === "brackets" ||
    tag.startsWith("brackets:")
  );
}

export async function POST(request: NextRequest) {
  let secret: string | null = null;
  let tags: string[] = [];
  let cacheTags: string[] = [];

  try {
    const body = await request.json();
    if (typeof body.secret === "string") secret = body.secret;
    if (Array.isArray(body.tags)) tags = body.tags;
    if (Array.isArray(body.cacheTags)) cacheTags = body.cacheTags;
  } catch {
    // no valid JSON body
  }

  const hasSanityTags = tags.length > 0;
  const hasCacheTags = cacheTags.length > 0;

  if (!hasSanityTags && !hasCacheTags) {
    return Response.json({ error: "No tags provided" }, { status: 400 });
  }

  if (hasSanityTags && hasCacheTags) {
    return Response.json(
      { error: "Provide either tags or cacheTags, not both" },
      { status: 400 },
    );
  }

  if (hasSanityTags) {
    if (!sanityRevalidateSecret) {
      console.error(
        "SANITY_REVALIDATE_SECRET environment variable is required",
      );
      return Response.json({ error: "Unexpected error" }, { status: 500 });
    }
    if (!secret || !safeCompare(secret, sanityRevalidateSecret)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.info("Revalidating Sanity tags from expirator service", { tags });

    for (const tag of tags) {
      // Sanity content is safe to regenerate in the background.
      revalidateTag(`sanity:${tag}`, "max");
    }

    return Response.json({
      service: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      tags,
      cacheTags: [],
    });
  }

  if (!cacheRevalidateSecret) {
    console.error("CACHE_REVALIDATE_SECRET environment variable is required");
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
  if (!secret || !safeCompare(secret, cacheRevalidateSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!cacheTags.every(isAllowlistedCacheTag)) {
    return Response.json(
      {
        error:
          "cacheTags must be post:*, posts:*, rankings, rankings:*, ratings, ratings:*, brackets, or brackets:*",
      },
      { status: 400 },
    );
  }

  console.info("Expiring app cache tags", { cacheTags });

  for (const tag of cacheTags) {
    // Every allowlisted tag is display data: serve the cached page while it
    // regenerates. Voting reads Postgres directly, never these caches, so a
    // stale rankings page can't open or close a ballot.
    revalidateTag(tag, "max");
  }

  return Response.json({
    service: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    tags: [],
    cacheTags,
  });
}
