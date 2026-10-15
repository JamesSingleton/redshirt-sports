import { revalidateTag } from "next/cache";

import { safeCompare } from "@/lib/safe-compare";

const sanityRevalidateSecret = process.env.SANITY_REVALIDATE_SECRET;

/**
 * Sanity content webhook. Expires `sanity:<_type>` without replacing
 * the expirator route at `/api/revalidate-tags`.
 */
export async function POST(request: Request) {
  if (!sanityRevalidateSecret) {
    console.error("SANITY_REVALIDATE_SECRET environment variable is required");
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }

  let body: { _type?: unknown; secret?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const headerSecret = request.headers.get("x-revalidate-secret");
  const secret =
    typeof headerSecret === "string"
      ? headerSecret
      : typeof body.secret === "string"
        ? body.secret
        : "";

  if (!secret || !safeCompare(secret, sanityRevalidateSecret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (typeof body._type !== "string" || body._type.length === 0) {
    return Response.json({ error: "Missing _type" }, { status: 400 });
  }

  revalidateTag(`sanity:${body._type}`, "max");
  return Response.json({ revalidated: true, tag: `sanity:${body._type}` });
}
