import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  apiVersion: "2025-02-06",
  token: process.env.SANITY_DEPLOY_TOKEN,
  useCdn: false,
});

type CustomUrlValue = {
  _type?: string;
  type?: string;
  external?: string;
  internalType?: string;
  internalUrl?: string;
  openInNewTab?: boolean;
  href?: string;
  internal?: { _ref: string; _type: string };
  sportNewsLink?: Record<string, unknown>;
  [key: string]: unknown;
};

type PortableTextBlock = {
  _type: string;
  _key: string;
  markDefs?: Array<{
    _key: string;
    _type: string;
    customLink?: CustomUrlValue;
    [key: string]: unknown;
  }>;
  children?: Array<{ _key: string; marks?: string[]; [key: string]: unknown }>;
  [key: string]: unknown;
};

function convertCustomUrl(
  value: CustomUrlValue | undefined,
): CustomUrlValue | undefined {
  if (!value || value._type !== "customUrl") {
    return value;
  }

  if (value.type === "external" && value.external?.startsWith("/")) {
    return {
      ...value,
      type: "internal",
      internalType: "custom",
      internalUrl: value.external,
      external: undefined,
    };
  }

  if (value.type === "internal" && !value.internalType) {
    return {
      ...value,
      internalType: value.internal?._ref ? "reference" : "custom",
    };
  }

  return value;
}

function convertLinkUrl<T extends { url?: CustomUrlValue }>(link: T): T {
  if (!link.url) {
    return link;
  }

  const nextUrl = convertCustomUrl(link.url);
  if (nextUrl === link.url) {
    return link;
  }

  return { ...link, url: nextUrl };
}

function convertMarkDefs(markDefs: PortableTextBlock["markDefs"]) {
  if (!markDefs?.length) {
    return markDefs;
  }

  return markDefs.map((mark) => {
    if (mark._type !== "customLink" || !mark.customLink) {
      return mark;
    }

    const nextCustomLink = convertCustomUrl(mark.customLink);
    if (nextCustomLink === mark.customLink) {
      return mark;
    }

    return { ...mark, customLink: nextCustomLink };
  });
}

function convertBlock(block: PortableTextBlock): PortableTextBlock {
  if (block._type !== "block") {
    return block;
  }

  return {
    ...block,
    markDefs: convertMarkDefs(block.markDefs),
  };
}

function convertBody(body: PortableTextBlock[] | null | undefined) {
  if (!body?.length) {
    return body;
  }
  return body.map(convertBlock);
}

type FooterDoc = {
  _id: string;
  columns?: Array<{
    links?: Array<{ url?: CustomUrlValue; [key: string]: unknown }>;
    [key: string]: unknown;
  }>;
};

type NavbarDoc = {
  _id: string;
  columns?: Array<
    | {
        _type: "navbarColumn";
        links?: Array<{ url?: CustomUrlValue; [key: string]: unknown }>;
        [key: string]: unknown;
      }
    | {
        _type: "navbarLink";
        url?: CustomUrlValue;
        [key: string]: unknown;
      }
  >;
};

function convertFooterColumns(columns: FooterDoc["columns"]) {
  if (!columns?.length) {
    return columns;
  }

  return columns.map((column) => ({
    ...column,
    links: column.links?.map((link) => convertLinkUrl(link)),
  }));
}

function convertNavbarColumns(columns: NavbarDoc["columns"]) {
  if (!columns?.length) {
    return columns;
  }

  return columns.map((column) => {
    if (column._type === "navbarColumn") {
      return {
        ...column,
        links: column.links?.map((link) => convertLinkUrl(link)),
      };
    }

    return convertLinkUrl(column);
  });
}

async function migrate() {
  const [footer, navbar, posts] = await Promise.all([
    client.fetch<FooterDoc | null>(
      `*[_type == "footer" && _id == "footer"][0]`,
    ),
    client.fetch<NavbarDoc | null>(
      `*[_type == "navbar" && _id == "navbar"][0]`,
    ),
    client.fetch<Array<{ _id: string; body?: PortableTextBlock[] }>>(
      `*[_type == "post" && defined(body)]{ _id, body }`,
    ),
  ]);

  let updated = 0;

  if (footer?.columns) {
    const nextColumns = convertFooterColumns(footer.columns);
    if (JSON.stringify(nextColumns) !== JSON.stringify(footer.columns)) {
      await client.patch(footer._id).set({ columns: nextColumns }).commit();
      updated += 1;
      console.log(`Updated footer (${footer._id})`);
    }
  }

  if (navbar?.columns) {
    const nextColumns = convertNavbarColumns(navbar.columns);
    if (JSON.stringify(nextColumns) !== JSON.stringify(navbar.columns)) {
      await client.patch(navbar._id).set({ columns: nextColumns }).commit();
      updated += 1;
      console.log(`Updated navbar (${navbar._id})`);
    }
  }

  for (const post of posts) {
    const nextBody = convertBody(post.body);
    if (JSON.stringify(nextBody) === JSON.stringify(post.body)) {
      continue;
    }

    await client.patch(post._id).set({ body: nextBody }).commit();
    updated += 1;
    console.log(`Updated post ${post._id}`);
  }

  console.log(`Migration complete. Updated ${updated} documents.`);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
