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
  let cacheTags: string[] = [];

  try {
    const body = await request.json();
    if (body.secret) secret = body.secret;
    if (Array.isArray(body.tags)) tags = body.tags;
    if (Array.isArray(body.cacheTags)) cacheTags = body.cacheTags;
  } catch {
    // no valid JSON body
  }

  if (secret !== expireTagsSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (tags.length === 0 && cacheTags.length === 0) {
    return Response.json({ error: "No tags provided" }, { status: 400 });
  }

  console.info("Expiring tags from expirator service", { tags, cacheTags });

  for (const tag of tags) {
    // Sanity Content Lake sync tags are stored as `sanity:${id}`.
    // App-owned tags (e.g. rankings) are passed through unchanged.
    const fullTag = tag.startsWith("rankings") ? tag : `sanity:${tag}`;
    // The `expire: 0` option makes revalidation behave as `updateTag` in a server action, it will be guaranteed to be fresh when visitors call `refresh()`.
    // The trade-off is that the app has `<Link>` prefetch disabled to avoid https://github.com/vercel/next.js/issues/93210
    revalidateTag(fullTag, { expire: 0 });
  }

  for (const tag of cacheTags) {
    revalidateTag(tag, { expire: 0 });
  }

  return Response.json({
    service: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    tags,
    cacheTags,
  });
}
