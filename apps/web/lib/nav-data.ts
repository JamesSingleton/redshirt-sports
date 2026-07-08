import type { QueryNavbarDataResult } from "@redshirt-sports/sanity/types";

import type { NavLink } from "@/lib/nav-rankings";
import { resolveSportRankings } from "@/lib/nav-rankings";
import type { Top25RankingsData } from "@/components/nav-types";

type NavbarColumnItem = Extract<
  NonNullable<NonNullable<QueryNavbarDataResult>["columns"]>[number],
  { type: "column" }
>;

type NavbarLinkItem = Extract<
  NonNullable<NonNullable<QueryNavbarDataResult>["columns"]>[number],
  { type: "link" }
>;

type NavbarColumnLink = NonNullable<NavbarColumnItem["links"]>[number];

export type ResolvedNavbarColumn = {
  _key: string;
  title: string;
  sections: {
    _key: string;
    groupLabel?: string | null;
    links: NavLink[];
  }[];
};

export type ResolvedNavbarItem =
  | ({ type: "link" } & NavLink & { _key: string })
  | ({ type: "column" } & ResolvedNavbarColumn);

function mapColumnLink(link: NavbarColumnLink): NavLink | null {
  if (!link.href || !link.name) {
    return null;
  }

  return {
    label: link.name,
    href: link.href,
    description: link.description,
    openInNewTab: link.openInNewTab,
  };
}

function groupLinksByLabel(
  links: NavbarColumnLink[],
): ResolvedNavbarColumn["sections"] {
  const sections: ResolvedNavbarColumn["sections"] = [];
  let currentSection: ResolvedNavbarColumn["sections"][number] | null = null;
  let currentLabel: string | null | undefined;

  for (const link of links) {
    if (!link) continue;

    const mapped = mapColumnLink(link);
    if (!mapped) continue;

    const groupLabel = link.groupLabel ?? null;
    if (!currentSection || groupLabel !== currentLabel) {
      currentLabel = groupLabel;
      currentSection = {
        _key: `section-${link._key}`,
        groupLabel,
        links: [],
      };
      sections.push(currentSection);
    }

    currentSection.links.push(mapped);
  }

  return sections;
}

function injectRankingsSection(
  sections: ResolvedNavbarColumn["sections"],
  sportSlug: string | null | undefined,
  latestRankings: Top25RankingsData,
): ResolvedNavbarColumn["sections"] {
  if (!sportSlug) {
    return sections;
  }

  const rankingLinks = resolveSportRankings(sportSlug, latestRankings);
  if (rankingLinks.length === 0) {
    return sections;
  }

  const rankingsSection = {
    _key: `rankings-${sportSlug}`,
    groupLabel: "Top 25 Rankings",
    links: rankingLinks,
  };

  const hasRankingsSection = sections.some(
    (section) =>
      section.groupLabel?.toLowerCase().includes("ranking") ||
      section.links.some((link) => link.href.includes("/rankings/")),
  );

  if (hasRankingsSection) {
    return sections;
  }

  return [...sections, rankingsSection];
}

export function resolveNavbarItems(
  navbarData: QueryNavbarDataResult | null | undefined,
  latestRankings: Top25RankingsData,
): ResolvedNavbarItem[] {
  if (!navbarData?.columns?.length) {
    return [];
  }

  const items: ResolvedNavbarItem[] = [];

  for (const column of navbarData.columns) {
    if (!column) continue;

    if (column.type === "link") {
      const link = column as NavbarLinkItem;
      if (!link.href || !link.name) {
        continue;
      }

      items.push({
        type: "link",
        _key: column._key,
        label: link.name,
        href: link.href,
        openInNewTab: link.openInNewTab,
      });
      continue;
    }

    const navColumn = column as NavbarColumnItem;
    if (!navColumn.title) {
      continue;
    }

    const sections = groupLinksByLabel(navColumn.links ?? []);
    const withRankings = injectRankingsSection(
      sections,
      navColumn.sportSlug,
      latestRankings,
    );

    if (withRankings.length === 0) {
      continue;
    }

    items.push({
      type: "column",
      _key: column._key,
      title: navColumn.title,
      sections: withRankings,
    });
  }

  return items;
}

export function flattenNavbarColumnLinks(
  column: ResolvedNavbarColumn,
): NavLink[] {
  return column.sections.flatMap((section) => section.links);
}
