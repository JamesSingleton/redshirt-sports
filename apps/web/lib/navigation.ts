import type { QueryNavbarDataResult } from "@redshirt-sports/sanity/types";

export type NavLink = {
  key: string;
  name: string;
  href: string;
  description: string | null;
  openInNewTab: boolean;
};

export type NavItem =
  | ({ type: "link" } & NavLink)
  | { type: "menu"; key: string; title: string; links: NavLink[] };

export type Navigation = {
  items: NavItem[];
  secondaryLinks: NavLink[];
  cta: NavLink | null;
};

type RawLink = {
  _key?: string;
  name: string | null;
  href: string | null;
  openInNewTab: boolean | null;
  description?: string | null;
};

function toNavLink(link: RawLink | null | undefined, key: string) {
  if (!link?.name || !link.href) return null;
  return {
    key: link._key ?? key,
    name: link.name,
    href: link.href,
    description: link.description ?? null,
    openInNewTab: Boolean(link.openInNewTab),
  } satisfies NavLink;
}

function compactLinks(links: RawLink[] | null | undefined) {
  return (links ?? []).flatMap((link, index) => {
    const navLink = toNavLink(link, String(index));
    return navLink ? [navLink] : [];
  });
}

/**
 * Drops links without a name or resolvable href and menus left empty, so a
 * half-edited navbar document renders cleanly instead of with dead links.
 */
export function toNavigation(data: QueryNavbarDataResult): Navigation {
  const items = (data?.items ?? []).flatMap((item): NavItem[] => {
    if (item.type === "menu") {
      const links = compactLinks(item.links);
      return links.length
        ? [{ type: "menu", key: item._key, title: item.title, links }]
        : [];
    }
    const link = toNavLink(item, item._key);
    return link ? [{ type: "link", ...link }] : [];
  });

  return {
    items,
    secondaryLinks: compactLinks(data?.secondaryLinks),
    cta: toNavLink(data?.cta, "cta"),
  };
}

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
