import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

const expireTagsSecret = process.env.SANITY_REVALIDATE_SECRET;

export async function POST(request: NextRequest) {
  if (!expireTagsSecret) {
    console.error("SANITY_REVALIDATE_SECRET environment variable is required");
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }

  let secret: string | null = null;
  let tags: string[] = [];

  try {
    const body = await request.json();
    if (!secret && body.secret) secret = body.secret;
    if (tags.length === 0 && Array.isArray(body.tags)) tags = body.tags;
  } catch {
    // no valid JSON body
  }

  if (secret !== expireTagsSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (tags.length === 0) {
    return Response.json({ error: "No tags provided" }, { status: 400 });
  }

  console.info("Expiring tags from expirator service", tags);

  for (const tag of tags) {
    // Bare app tags (e.g. "rankings") pass through; Sanity doc ids stay namespaced.
    const cacheKey =
      tag === "rankings" || tag.startsWith("sanity:") ? tag : `sanity:${tag}`;
    // The `expire: 0` option makes revalidation behave as `updateTag` in a server action.
    revalidateTag(cacheKey, { expire: 0 });
  }

  return Response.json({
    service: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    tags,
  });
}
