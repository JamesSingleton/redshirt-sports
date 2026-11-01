import type {
  NavbarItems,
  NavColumnItem,
  NavLinkItem,
  NavRankingsMenuItem,
  NavSportMenuItem,
} from "@/components/navbar";

const footballSport = {
  _id: "sport-fb",
  name: "Football",
  slug: "football",
  polls: [
    { _key: "poll-fbs", slug: "fbs", label: null },
    { _key: "poll-fcs", slug: "fcs", label: "FCS" },
  ],
};

const basketballSport = {
  _id: "sport-mbb",
  name: "Men's Basketball",
  slug: "mens-basketball",
  polls: [{ _key: "poll-mm", slug: "mid-major", label: null }],
};

const noPollsSport = {
  _id: "sport-wbb",
  name: "Women's Basketball",
  slug: "womens-basketball",
  polls: null,
};

export const footballMenu = {
  _key: "menu-fb",
  _type: "navSportMenu",
  label: null,
  sport: footballSport,
  divisions: [
    { _id: "group-fbs", name: "FBS", slug: "fbs" },
    { _id: "group-broken", name: "Broken", slug: null },
  ],
} as unknown as NavSportMenuItem;

export const noPollsSportMenu = {
  _key: "menu-wbb",
  _type: "navSportMenu",
  label: "  WBB Hoops ",
  sport: noPollsSport,
  divisions: null,
} as unknown as NavSportMenuItem;

export const rankingsMenu = {
  _key: "menu-rankings",
  _type: "navRankingsMenu",
  label: "Rankings",
  sports: [footballSport, basketballSport, noPollsSport],
} as unknown as NavRankingsMenuItem;

export const singleSportRankingsMenu = {
  _key: "menu-rankings-fb",
  _type: "navRankingsMenu",
  label: "Polls",
  sports: [footballSport],
} as unknown as NavRankingsMenuItem;

export const emptyRankingsMenu = {
  _key: "menu-rankings-empty",
  _type: "navRankingsMenu",
  label: "Empty Rankings",
  sports: [noPollsSport],
} as unknown as NavRankingsMenuItem;

export const aboutColumn = {
  _key: "col-about",
  _type: "navbarColumn",
  title: "About",
  links: [
    {
      _key: "link-about",
      name: "About Us",
      description: "Who we are",
      openInNewTab: false,
      href: "/about",
    },
    {
      _key: "link-x",
      name: "Follow on X",
      description: null,
      openInNewTab: true,
      href: "https://x.com/redshirtsports",
    },
    {
      _key: "link-broken",
      name: "Broken",
      description: null,
      openInNewTab: null,
      href: null,
    },
  ],
} as unknown as NavColumnItem;

export const emptyColumn = {
  _key: "col-empty",
  _type: "navbarColumn",
  title: null,
  links: [
    {
      _key: "link-none",
      name: "Nothing",
      description: null,
      openInNewTab: null,
      href: null,
    },
  ],
} as unknown as NavColumnItem;

export const teamsLink = {
  _key: "link-teams",
  _type: "navbarLink",
  name: "Teams",
  openInNewTab: null,
  href: "/college/teams",
} as unknown as NavLinkItem;

export const shopLink = {
  _key: "link-shop",
  _type: "navbarLink",
  name: "Shop",
  openInNewTab: true,
  href: "https://shop.example.com",
} as unknown as NavLinkItem;

export const brokenLink = {
  _key: "link-nowhere",
  _type: "navbarLink",
  name: null,
  openInNewTab: null,
  href: null,
} as unknown as NavLinkItem;

/** A full nav covering every item type and edge case. */
export const navItems: NavbarItems = [
  footballMenu,
  noPollsSportMenu,
  rankingsMenu,
  emptyRankingsMenu,
  aboutColumn,
  emptyColumn,
  teamsLink,
  shopLink,
  brokenLink,
];
