import { normalizedHeadingStyles } from "../house-rules/body";
import {
  isCurrentLink,
  isLegacyLink,
  type LinkType,
  ownSitePath,
} from "../house-rules/links";
import {
  type BodyBlock,
  isSpan,
  isTextBlock,
  type MarkDef,
  type TextBlock,
} from "../house-rules/types";

/**
 * Pure rewrites of article body blocks, used by the content migrations. Each
 * returns the same array instance when nothing needs to change, so a
 * migration can tell "already clean" from "rewritten".
 */

const ALLOWED_DECORATORS = new Set(["strong", "em"]);
/** Documents a `link` of type "internal" can point at. */
const LINKABLE_TYPES = new Set(["post", "school", "author", "legal"]);

export type Link = {
  _type: "link";
  _key: string;
  linkType: LinkType;
  reference?: { _type: "reference"; _ref: string; _weak: true };
  path?: string;
  href?: string;
  openInNewTab?: boolean;
};

/**
 * What a migration knows about the documents old links point at. Conference
 * and division links have no page of their own, so they become a path to the
 * matching news page; `sportSlug` is the article's sport, used to pick one.
 */
export type LinkLookup = {
  /** `_type` of a referenced document, or undefined if it doesn't exist. */
  typeOf(id: string): string | undefined;
  /** News page path for a conference, division, or classification. */
  newsPath(id: string, sportSlug: string | undefined): string | null;
  /** Path for an old "sport news archive" link. */
  sportNewsPath(link: Record<string, unknown>): string | null;
};

const internal = (key: string, ref: string): Link => ({
  _type: "link",
  _key: key,
  linkType: "internal",
  // Matches the schema's `weak: true`; see schemaTypes/definitions/link.ts.
  reference: { _type: "reference", _ref: ref, _weak: true },
});

const path = (key: string, value: string): Link => ({
  _type: "link",
  _key: key,
  linkType: "path",
  path: value,
});

/** A URL becomes a path when it's on our own domain or already relative. */
function fromUrl(key: string, url: string, openInNewTab: boolean): Link {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return path(key, trimmed);
  }
  const own = ownSitePath(trimmed);
  if (own) return path(key, own);
  return {
    _type: "link",
    _key: key,
    linkType: "external",
    href: trimmed,
    openInNewTab,
  };
}

function fromReference(
  key: string,
  ref: string | undefined,
  lookup: LinkLookup,
  sportSlug: string | undefined,
): Link | null {
  if (!ref) return null;
  const type = lookup.typeOf(ref);
  if (type && LINKABLE_TYPES.has(type)) return internal(key, ref);
  const newsPath = lookup.newsPath(ref, sportSlug);
  return newsPath ? path(key, newsPath) : null;
}

/** The `link` an old-format mark becomes, or null when it points nowhere. */
export function convertLegacyLink(
  mark: MarkDef,
  lookup: LinkLookup,
  sportSlug?: string,
): Link | null {
  if (isCurrentLink(mark)) return mark as unknown as Link;
  const key = mark._key;

  if (mark._type === "link") {
    const href = typeof mark.href === "string" ? mark.href : "";
    return href.trim() ? fromUrl(key, href, mark.blank !== false) : null;
  }

  if (mark._type === "internalLink") {
    const ref = (mark.reference as { _ref?: string } | undefined)?._ref;
    return fromReference(key, ref, lookup, sportSlug);
  }

  // `customLink` wraps a customUrl object; `customUrl` is that object flat.
  const url = (mark._type === "customLink" ? mark.customLink : mark) as
    | Record<string, unknown>
    | undefined;
  if (mark._type !== "customLink" && mark._type !== "customUrl") return null;
  if (!url) return null;

  if (url.type === "external") {
    const external = typeof url.external === "string" ? url.external : "";
    return external.trim()
      ? fromUrl(key, external, url.openInNewTab !== false)
      : null;
  }
  if (url.internalType === "custom") {
    const value = typeof url.internalUrl === "string" ? url.internalUrl : "";
    return value.trim() ? fromUrl(key, value, false) : null;
  }
  if (url.internalType === "sportNews") {
    const value = lookup.sportNewsPath(
      (url.sportNewsLink ?? {}) as Record<string, unknown>,
    );
    return value ? path(key, value) : null;
  }
  const ref = (url.internal as { _ref?: string } | undefined)?._ref;
  return fromReference(key, ref, lookup, sportSlug);
}

function convertBlockLinks(
  block: TextBlock,
  lookup: LinkLookup,
  sportSlug: string | undefined,
): TextBlock {
  const markDefs = block.markDefs ?? [];
  if (!markDefs.some(isLegacyLink)) return block;

  const dropped = new Set<string>();
  const nextMarkDefs: MarkDef[] = [];
  for (const mark of markDefs) {
    if (!isLegacyLink(mark)) {
      nextMarkDefs.push(mark);
      continue;
    }
    const converted = convertLegacyLink(mark, lookup, sportSlug);
    if (converted) nextMarkDefs.push(converted as unknown as MarkDef);
    else dropped.add(mark._key);
  }

  return {
    ...block,
    markDefs: nextMarkDefs,
    children: (block.children ?? []).map((child) =>
      isSpan(child) && child.marks?.some((mark) => dropped.has(mark))
        ? { ...child, marks: child.marks.filter((mark) => !dropped.has(mark)) }
        : child,
    ),
  };
}

/**
 * Rewrite every old-format link as a `link`, keeping its `_key` so the text
 * stays attached. A link that points nowhere is removed and its text kept.
 */
export function convertLegacyLinks(
  body: BodyBlock[],
  lookup: LinkLookup,
  sportSlug?: string,
): BodyBlock[] {
  let changed = false;
  const next = body.map((block) => {
    if (!isTextBlock(block)) return block;
    const converted = convertBlockLinks(block, lookup, sportSlug);
    if (converted !== block) changed = true;
    return converted;
  });
  return changed ? next : body;
}

/**
 * Make the outline valid (first heading h2, no skipped level, nothing below
 * h4) and drop decorators the article template doesn't render.
 */
export function normalizeBody(body: BodyBlock[]): BodyBlock[] {
  const headingStyles = normalizedHeadingStyles(body);
  let changed = false;

  const next = body.map((block) => {
    if (!isTextBlock(block)) return block;
    const markKeys = new Set((block.markDefs ?? []).map((mark) => mark._key));
    const style = headingStyles.get(block._key);
    let childrenChanged = false;

    const children = (block.children ?? []).map((child) => {
      if (!isSpan(child) || !child.marks?.length) return child;
      const marks = child.marks.filter(
        (mark) => markKeys.has(mark) || ALLOWED_DECORATORS.has(mark),
      );
      if (marks.length === child.marks.length) return child;
      childrenChanged = true;
      return { ...child, marks };
    });

    if (!style && !childrenChanged) return block;
    changed = true;
    return { ...block, ...(style ? { style } : {}), children };
  });

  return changed ? next : body;
}

/**
 * Photos used one "caption" field as alt text. Move it to `alt` (unless alt
 * is already set) and remove the caption, which the site no longer shows.
 */
export function captionToAlt<T extends { alt?: string; caption?: string }>(
  image: T,
): T {
  if (image.caption === undefined) return image;
  const { caption, ...rest } = image;
  const alt = image.alt || caption?.trim() || undefined;
  return { ...rest, ...(alt ? { alt } : {}) } as T;
}

export function moveInlineCaptionsToAlt(body: BodyBlock[]): BodyBlock[] {
  let changed = false;
  const next = body.map((block) => {
    if (isTextBlock(block) || block._type !== "image") return block;
    const moved = captionToAlt(block as BodyBlock & { caption?: string });
    if (moved !== block) changed = true;
    return moved;
  });
  return changed ? next : body;
}

/** Blocks in `next` that differ from the block with the same key in `prev`. */
export function changedBlocks(
  prev: BodyBlock[],
  next: BodyBlock[],
): BodyBlock[] {
  if (prev === next) return [];
  const before = new Map(prev.map((block) => [block._key, block]));
  return next.filter((block) => before.get(block._key) !== block);
}
