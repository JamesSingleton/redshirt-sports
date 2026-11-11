import { SITE_HOSTS } from "./limits";
import { error, type Finding, type MarkDef, warning } from "./types";

/**
 * The one link annotation article and legal bodies use (`_type: "link"`).
 *
 * - `internal`: a document with its own page (article, team, author, legal),
 *   stored as a reference so the link follows the page if its URL changes.
 * - `path`: any other page on this site, e.g. /college/football/news/fcs.
 * - `external`: another website.
 */
export const LINK_TYPES = [
  { title: "Article, team, or author page", value: "internal" },
  { title: "Other page on this site", value: "path" },
  { title: "Another website", value: "external" },
] as const;

export type LinkType = (typeof LINK_TYPES)[number]["value"];

export type LinkValue = {
  linkType?: string;
  reference?: { _ref?: string };
  path?: string;
  href?: string;
  openInNewTab?: boolean;
};

/** Hosts that are this site, so a URL on them should be a path instead. */
export function isOwnSiteUrl(value: string): boolean {
  try {
    return SITE_HOSTS.includes(new URL(value).hostname);
  } catch {
    return false;
  }
}

/** The path part of one of our own URLs: https://www.redshirtsports.com/a?b → /a?b */
export function ownSitePath(value: string): string | null {
  try {
    const url = new URL(value);
    if (!SITE_HOSTS.includes(url.hostname)) return null;
    return `${url.pathname}${url.search}${url.hash}` || "/";
  } catch {
    return null;
  }
}

/**
 * True for a mark in the current format. Anything else that is a link
 * (`customLink`, `internalLink`, `customUrl`, or a `link` from before
 * `linkType` existed) is legacy and is converted by migration.
 */
export const isCurrentLink = (markDef: MarkDef) =>
  markDef._type === "link" && typeof markDef.linkType === "string";

const LEGACY_LINK_TYPES = new Set([
  "link",
  "customLink",
  "internalLink",
  "customUrl",
]);

export const isLegacyLink = (markDef: MarkDef) =>
  LEGACY_LINK_TYPES.has(markDef._type) && !isCurrentLink(markDef);

/** Whether a link stays on this site or leaves it, for body statistics. */
export function linkDirection(
  markDef: MarkDef,
): "internal" | "external" | null {
  if (!isCurrentLink(markDef)) return null;
  return markDef.linkType === "external" ? "external" : "internal";
}

/** Where a link points: checked on the link itself, not on its text. */
export function linkTargetFindings(link: LinkValue | undefined): Finding[] {
  if (!link) return [];
  const type = link.linkType;

  if (type === "internal") {
    return link.reference?._ref
      ? []
      : [error("link.reference", "Pick the page this links to.")];
  }

  if (type === "path") {
    const path = link.path?.trim() ?? "";
    if (!path)
      return [
        error("link.path", "Add the path, e.g. /college/football/news/fcs."),
      ];
    if (isOwnSiteUrl(path)) {
      return [
        error("link.path-full-url", `Use just the path: ${ownSitePath(path)}`),
      ];
    }
    if (!path.startsWith("/") || path.startsWith("//")) {
      return [
        error(
          "link.path-format",
          "A path starts with a single /, e.g. /college/teams. For another website, choose Another website.",
        ),
      ];
    }
    if (/\s/.test(path)) {
      return [error("link.path-spaces", "Paths can't contain spaces.")];
    }
    return [];
  }

  if (type === "external") {
    const href = link.href?.trim() ?? "";
    if (!href) return [error("link.href", "Add the web address.")];
    if (isOwnSiteUrl(href)) {
      return [
        error(
          "link.own-site-external",
          "This is a Redshirt Sports address. Link the article, team, or author page instead, or choose Other page on this site, so the link follows the page if its URL changes.",
        ),
      ];
    }
    if (href.startsWith("http://")) {
      return [
        warning(
          "link.insecure",
          "This is an http:// address. Use https:// if the site supports it.",
        ),
      ];
    }
    return [];
  }

  return [error("link.type", "Choose where the link goes.")];
}
