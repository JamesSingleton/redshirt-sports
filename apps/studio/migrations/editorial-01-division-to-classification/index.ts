import {
  at,
  defineMigration,
  type NodePatch,
  set,
  setIfMissing,
  unset,
} from "sanity/migrate";

/**
 * Moves every reference from a `division` document to the `classification`
 * with the same slug (d1, d2, d3, naia), so `division` can be retired:
 *
 * - post.division             → post.classification
 * - conference.division       → conference.primaryClassification
 * - sportSubgrouping.parentDivision is dropped (parentClassification is set)
 * - navbar menus and sport news links are re-pointed in place
 *
 * Safe to re-run. Run `editorial-10-delete-division-documents` last.
 */

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type PathSegment = string | number | { _key: string };
type Ref = { _type: "reference"; _ref: string };

let mapPromise: Promise<Map<string, string>> | undefined;

function loadDivisionMap(
  fetch: <T>(query: string) => Promise<T>,
): Promise<Map<string, string>> {
  mapPromise ??= fetch<{
    divisions: Array<{ _id: string; slug: string }>;
    classifications: Array<{ _id: string; slug: string }>;
  }>(`{
    "divisions": *[_type == "division"]{_id, "slug": slug.current},
    "classifications": *[_type == "classification" && !(_id in path("drafts.**"))]{_id, "slug": slug.current}
  }`).then(({ divisions, classifications }) => {
    const bySlug = new Map(classifications.map((c) => [c.slug, c._id]));
    const map = new Map<string, string>();
    for (const division of divisions) {
      const target = bySlug.get(division.slug);
      if (target) map.set(division._id.replace(/^drafts\./, ""), target);
    }
    return map;
  });
  return mapPromise;
}

/** Every reference to a mapped division below `node`, with its path. */
function findDivisionRefs(
  node: Json,
  path: PathSegment[],
  map: Map<string, string>,
  found: Array<{ path: PathSegment[]; node: { [key: string]: Json } }>,
) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      const key =
        item && typeof item === "object" && !Array.isArray(item)
          ? (item._key as string | undefined)
          : undefined;
      findDivisionRefs(
        item,
        [...path, key ? { _key: key } : index],
        map,
        found,
      );
    });
    return;
  }
  if (!node || typeof node !== "object") return;
  if (typeof node._ref === "string" && map.has(node._ref)) {
    found.push({ path, node });
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("_")) continue;
    findDivisionRefs(value, [...path, key], map, found);
  }
}

const RENAMES: Record<string, { from: string; to: string }> = {
  post: { from: "division", to: "classification" },
  conference: { from: "division", to: "primaryClassification" },
  sportSubgrouping: { from: "parentDivision", to: "parentClassification" },
};

export default defineMigration({
  title: "Move division references to classification",
  documentTypes: [
    "post",
    "conference",
    "sportSubgrouping",
    "navbar",
    "footer",
    "advertisement",
    "legal",
  ],
  // No filter: the runner evaluates filters one document at a time, so it
  // can't ask "does this reference a division?". Untouched documents return
  // no patches.
  migrate: {
    async document(doc, context) {
      const map = await loadDivisionMap((query) => context.client.fetch(query));
      const patches: NodePatch[] = [];
      const rename = RENAMES[doc._type];
      const source = doc as unknown as { [key: string]: Json };

      if (rename) {
        const old = source[rename.from] as { _ref?: string } | undefined;
        if (old?._ref) {
          const target = map.get(old._ref);
          if (!target) {
            throw new Error(
              `${doc._type} ${doc._id} points at division ${old._ref}, which has no classification with the same slug. Create that classification, then re-run.`,
            );
          }
          const ref: Ref = { _type: "reference", _ref: target };
          patches.push(at(rename.to, setIfMissing(ref)));
        }
        if (source[rename.from] !== undefined) {
          patches.push(at(rename.from, unset()));
        }
      }

      const found: Array<{
        path: PathSegment[];
        node: { [key: string]: Json };
      }> = [];
      for (const [key, value] of Object.entries(source)) {
        if (key.startsWith("_") || key === rename?.from) continue;
        findDivisionRefs(value, [key], map, found);
      }
      for (const { path, node } of found) {
        patches.push(
          at(
            path,
            set({ ...node, _ref: map.get(node._ref as string) as string }),
          ),
        );
      }
      return patches;
    },
  },
});
