import { revalidateTag } from "next/cache";
// import { timingSafeEqual } from "node:crypto";

export async function POST(request: Request) {
  // const expectedSecret = process.env.SANITY_REVALIDATE_TAGS_SECRET;
  // const secret = new URL(request.url).searchParams.get("secret");

  // if (!expectedSecret) {
  //   return Response.json(
  //     { error: "Server configuration error" },
  //     { status: 500 },
  //   );
  // }

  // const expectedSecretBuffer = Buffer.from(expectedSecret);
  // const secretBuffer = Buffer.from(secret ?? "");

  // if (
  //   expectedSecretBuffer.length !== secretBuffer.length ||
  //   !timingSafeEqual(expectedSecretBuffer, secretBuffer)
  // ) {
  //   return Response.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const { tags } = (await request.json()) as { tags?: string[] };

  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) {
    return Response.json(
      { error: "`tags` must be an array of strings" },
      { status: 400 },
    );
  }

  for (const tag of tags) {
    // `sanityFetch` returned by `defineLive` from `next-sanity/live` prefixes its `cacheTag` calls with `sanity:`, so we need to add the same prefix here
    revalidateTag(`sanity:${tag}`, { expire: 0 });
  }

  return Response.json({ revalidated: tags });
}
