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

type LatestRankingsTarget = {
  sport: string | null;
  poll: string | null;
  label: string | null;
};

type RawLink = {
  _key?: string;
  name: string | null;
  href: string | null;
  openInNewTab: boolean | null;
  description?: string | null;
  latestRankings?: LatestRankingsTarget | null;
};

type RawNavItem =
  | ({ _key: string; type: "link" } & RawLink)
  | { _key: string; type: "menu"; title: string; links: RawLink[] | null };

/** The link-bearing slice of `QueryNavbarDataResult`. */
export type NavbarLinks = {
  items: RawNavItem[] | null;
  secondaryLinks: RawLink[] | null;
  cta: RawLink | null;
};

export type ResolveLatestRankingsHref = (target: {
  sport: string;
  poll: string;
}) => Promise<string | null>;

/**
 * Points "Latest rankings" links at the newest published poll and falls back
 * to the generated label ("Latest FCS rankings") when the editor left the name
 * blank. Links whose poll has no rankings yet get a null href, so
 * `toNavigation` drops them.
 */
export async function resolveLatestRankingsLinks(
  data: NavbarLinks | null,
  resolveHref: ResolveLatestRankingsHref,
): Promise<NavbarLinks | null> {
  if (!data) return null;

  async function resolveLink<T extends RawLink>(link: T): Promise<T> {
    const target = link.latestRankings;
    if (!target) return link;
    const href =
      target.sport && target.poll
        ? await resolveHref({ sport: target.sport, poll: target.poll })
        : null;
    return { ...link, name: link.name || target.label, href };
  }

  function resolveLinks(links: RawLink[] | null) {
    return links ? Promise.all(links.map(resolveLink)) : null;
  }

  const [items, secondaryLinks, cta] = await Promise.all([
    data.items
      ? Promise.all(
          data.items.map(async (item): Promise<RawNavItem> => {
            if (item.type === "menu") {
              return { ...item, links: await resolveLinks(item.links) };
            }
            return resolveLink(item);
          }),
        )
      : null,
    resolveLinks(data.secondaryLinks),
    data.cta ? resolveLink(data.cta) : null,
  ]);

  return { items, secondaryLinks, cta };
}

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
export function toNavigation(data: NavbarLinks | null): Navigation {
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
