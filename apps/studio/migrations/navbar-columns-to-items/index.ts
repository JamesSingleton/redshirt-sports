import { at, defineMigration, setIfMissing, unset } from "sanity/migrate";

type Ref = { _id: string };

/** Division news links for each sport menu, in display order (by slug). */
const SPORT_MENUS = [
  { sport: "football", divisions: ["fcs", "fbs", "d2", "d3"] },
  { sport: "mens-basketball", divisions: ["mid-major"] },
];

/** Sports listed in the Rankings menu. Add basketball when its polls launch. */
const RANKINGS_SPORTS = ["football"];

/** Old columns carried over unchanged (matched by title or link name). */
const KEEP_LINKS = ["Teams"];
const KEEP_COLUMNS = ["About"];

function reference(id: string, key?: string) {
  return { _type: "reference", _ref: id, ...(key ? { _key: key } : {}) };
}

/**
 * Convert the navbar's deprecated `columns` into `items`: sport menus and a
 * Rankings menu built from references, plus the Teams link and About column
 * copied as-is. Removes `columns` afterwards.
 */
export default defineMigration({
  title: "Navbar: columns to menu items",
  documentTypes: ["navbar"],
  filter: "defined(columns) && !defined(items)",
  migrate: {
    async document(navbar, context) {
      const { sports, groups } = await context.client.fetch<{
        sports: Array<Ref & { slug: string }>;
        groups: Array<Ref & { slug: string; _type: string }>;
      }>(`{
        "sports": *[_type == "sport" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current },
        "groups": *[_type in ["sportSubgrouping", "division"] && !(_id in path("drafts.**"))]{ _id, _type, "slug": slug.current }
      }`);

      const sportId = (slug: string) => {
        const match = sports.find((sport) => sport.slug === slug);
        if (!match) throw new Error(`No sport with slug "${slug}"`);
        return match._id;
      };
      // Prefer the sport-specific subgrouping (FBS/FCS) over a same-slug division.
      const groupId = (slug: string) => {
        const matches = groups.filter((group) => group.slug === slug);
        const match =
          matches.find((group) => group._type === "sportSubgrouping") ??
          matches[0];
        if (!match) throw new Error(`No division or subgrouping "${slug}"`);
        return match._id;
      };

      const columns = (navbar.columns ?? []) as Array<{
        _key: string;
        _type: string;
        name?: string;
        title?: string;
      }>;
      const kept = columns.filter((item) =>
        item._type === "navbarLink"
          ? KEEP_LINKS.includes(item.name ?? "")
          : KEEP_COLUMNS.includes(item.title ?? ""),
      );

      const items = [
        ...SPORT_MENUS.map(({ sport, divisions }) => ({
          _key: `menu-${sport}`,
          _type: "navSportMenu",
          sport: reference(sportId(sport)),
          divisions: divisions.map((slug) =>
            reference(groupId(slug), `division-${slug}`),
          ),
        })),
        {
          _key: "menu-rankings",
          _type: "navRankingsMenu",
          label: "Rankings",
          sports: RANKINGS_SPORTS.map((slug) =>
            reference(sportId(slug), `sport-${slug}`),
          ),
        },
        ...kept,
      ];

      return [at("items", setIfMissing(items)), at("columns", unset())];
    },
  },
});
