export interface NavLink {
  label: string;
  href: string;
}

export interface SportNavConfig {
  label: string;
  slug: string;
  allNewsHref: string;
  divisions: NavLink[];
}

/**
 * Static sport division metadata for college news pages and sidebars.
 * Main site navigation is CMS-driven via the navbar singleton.
 */
export const sportNavConfigs: SportNavConfig[] = [
  {
    label: "Football",
    slug: "football",
    allNewsHref: "/college/football/news",
    divisions: [
      { label: "Division I – FBS", href: "/college/football/news/fbs" },
      { label: "Division I – FCS", href: "/college/football/news/fcs" },
      { label: "Division II", href: "/college/football/news/d2" },
      { label: "Division III", href: "/college/football/news/d3" },
      { label: "NAIA", href: "/college/football/news/naia" },
      { label: "NCCAA", href: "/college/football/news/nccaa" },
    ],
  },
  {
    label: "Men's Basketball",
    slug: "mens-basketball",
    allNewsHref: "/college/mens-basketball/news",
    divisions: [
      {
        label: "Division I – Power Conference",
        href: "/college/mens-basketball/news/power-conference",
      },
      {
        label: "Division I – Mid-Major",
        href: "/college/mens-basketball/news/mid-major",
      },
      { label: "Division II", href: "/college/mens-basketball/news/d2" },
      { label: "Division III", href: "/college/mens-basketball/news/d3" },
      { label: "NAIA", href: "/college/mens-basketball/news/naia" },
      { label: "NCCAA", href: "/college/mens-basketball/news/nccaa" },
    ],
  },
  {
    label: "Women's Basketball",
    slug: "womens-basketball",
    allNewsHref: "/college/womens-basketball/news",
    divisions: [
      {
        label: "Division I – Power Conference",
        href: "/college/womens-basketball/news/power-conference",
      },
      {
        label: "Division I – Mid-Major",
        href: "/college/womens-basketball/news/mid-major",
      },
      { label: "Division II", href: "/college/womens-basketball/news/d2" },
      { label: "Division III", href: "/college/womens-basketball/news/d3" },
      { label: "NAIA", href: "/college/womens-basketball/news/naia" },
      { label: "NCCAA", href: "/college/womens-basketball/news/nccaa" },
    ],
  },
];
