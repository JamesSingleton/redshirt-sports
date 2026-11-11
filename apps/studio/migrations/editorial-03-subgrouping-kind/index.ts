import { at, defineMigration, set } from "sanity/migrate";

/**
 * Marks each subdivision as an NCAA designation (FBS, FCS) or common usage
 * (Power Conferences, Mid-Major: widely used, but the NCAA keeps no list).
 * Common-usage subdivisions should also get a written definition of who
 * counts, which only an editor can supply.
 */
const OFFICIAL_SLUGS = ["fbs", "fcs"];

export default defineMigration({
  title: "Set kind on sport subgroupings",
  documentTypes: ["sportSubgrouping"],
  // Also converts "editorial", the value an earlier version of the Studio
  // offered, which drafts edited then still hold.
  filter: '!defined(kind) || kind == "editorial"',
  migrate: {
    document(doc) {
      const slug = (doc.slug as { current?: string } | undefined)?.current;
      return [
        at(
          "kind",
          set(slug && OFFICIAL_SLUGS.includes(slug) ? "official" : "common"),
        ),
      ];
    },
  },
});
