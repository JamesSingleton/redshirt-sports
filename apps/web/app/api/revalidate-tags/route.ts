import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

const sanityRevalidateSecret = process.env.SANITY_REVALIDATE_SECRET;
const cacheRevalidateSecret = process.env.CACHE_REVALIDATE_SECRET;

function isAllowlistedCacheTag(tag: string) {
  return tag === "rankings" || tag.startsWith("rankings:");
}

export async function POST(request: NextRequest) {
  let secret: string | null = null;
  let tags: string[] = [];
  let cacheTags: string[] = [];

  try {
    const body = await request.json();
    if (body.secret) secret = body.secret;
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
    if (secret !== sanityRevalidateSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.info("Revalidating Sanity tags from expirator service", { tags });

    for (const tag of tags) {
      // Most Sanity content is safe to regenerate in the background. Rankings
      // remain immediately expired because they can change vote availability.
      revalidateTag(
        `sanity:${tag}`,
        tag === "rankings" ? { expire: 0 } : "max",
      );
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
  if (secret !== cacheRevalidateSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!cacheTags.every(isAllowlistedCacheTag)) {
    return Response.json(
      { error: "cacheTags must be rankings or rankings:*" },
      { status: 400 },
    );
  }

  console.info("Expiring app cache tags", { cacheTags });

  for (const tag of cacheTags) {
    revalidateTag(tag, { expire: 0 });
  }

  return Response.json({
    service: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    tags: [],
    cacheTags,
  });
}
