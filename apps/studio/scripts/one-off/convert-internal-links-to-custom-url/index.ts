import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  apiVersion: "2025-02-06",
  token: process.env.SANITY_DEPLOY_TOKEN,
  useCdn: false,
});

type PortableTextBlock = {
  _type: string;
  _key: string;
  markDefs?: Array<{
    _key: string;
    _type: string;
    reference?: { _ref: string; _type: string };
    [key: string]: unknown;
  }>;
  children?: Array<{ _key: string; marks?: string[]; [key: string]: unknown }>;
  [key: string]: unknown;
};

function convertMarkDefs(markDefs: PortableTextBlock["markDefs"]) {
  if (!markDefs?.length) return markDefs;

  return markDefs.map((mark) => {
    if (mark._type !== "internalLink" || !mark.reference?._ref) {
      return mark;
    }

    return {
      _key: mark._key,
      _type: "customUrl",
      type: "internal",
      openInNewTab: false,
      internal: {
        _type: "reference",
        _ref: mark.reference._ref,
      },
      href: "#",
    };
  });
}

function convertBlock(block: PortableTextBlock): PortableTextBlock {
  if (block._type !== "block") return block;

  return {
    ...block,
    markDefs: convertMarkDefs(block.markDefs),
  };
}

function convertBody(body: PortableTextBlock[] | null | undefined) {
  if (!body?.length) return body;
  return body.map(convertBlock);
}

async function migrate() {
  const posts = await client.fetch<
    Array<{ _id: string; body?: PortableTextBlock[] }>
  >(`*[_type == "post" && defined(body)]{ _id, body }`);

  let updated = 0;

  for (const post of posts) {
    const nextBody = convertBody(post.body);
    const changed = JSON.stringify(nextBody) !== JSON.stringify(post.body);
    if (!changed) continue;

    await client.patch(post._id).set({ body: nextBody }).commit();
    updated += 1;
    console.log(`Updated ${post._id}`);
  }

  console.log(`Migration complete. Updated ${updated} posts.`);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
