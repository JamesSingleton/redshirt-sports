import {
  at,
  defineMigration,
  insert,
  type NodePatch,
  set,
  setIfMissing,
  unset,
} from "sanity/migrate";

/**
 * Removes fields the schema no longer has, carrying their data over first
 * where it isn't already somewhere else:
 *
 * - post.author: single byline from before `authors`. In production every
 *   one is already in `authors`; any that isn't is added before removal.
 * - post.featuredArticle, post.mainImage: unused.
 * - school.conferenceAffiliationsBySport: an older copy of
 *   `conferenceAffiliations`. Sports only it has are copied over first.
 * - conference.description: unused.
 * - navbar.columns: replaced by `items`.
 */
const RETIRED: Record<string, string[]> = {
  post: ["author", "featuredArticle", "mainImage"],
  school: ["conferenceAffiliationsBySport"],
  conference: ["description"],
  navbar: ["columns"],
};

type Ref = { _type?: string; _ref?: string; _key?: string };
type Affiliation = { _key?: string; sport?: Ref; conference?: Ref };

const key = () => Math.random().toString(36).slice(2, 14);
const reference = (ref: string) => ({ _type: "reference", _ref: ref });

export default defineMigration({
  title: "Remove retired fields",
  documentTypes: Object.keys(RETIRED),
  filter:
    "defined(author) || defined(featuredArticle) || defined(mainImage) || defined(conferenceAffiliationsBySport) || defined(description) || defined(columns)",
  migrate: {
    document(doc) {
      const patches: NodePatch[] = [];

      const author = doc.author as Ref | undefined;
      if (doc._type === "post" && author?._ref) {
        const authors = (doc.authors ?? []) as Ref[];
        if (!authors.some((item) => item._ref === author._ref)) {
          patches.push(
            at("authors", setIfMissing([])),
            at(
              "authors",
              insert([{ ...reference(author._ref), _key: key() }], "before", 0),
            ),
          );
        }
      }

      if (doc._type === "school") {
        const current = (doc.conferenceAffiliations ?? []) as Affiliation[];
        const covered = new Set(current.map((row) => row.sport?._ref));
        const missing = (
          (doc.conferenceAffiliationsBySport ?? []) as Affiliation[]
        )
          .filter(
            (row) =>
              row.sport?._ref &&
              row.conference?._ref &&
              !covered.has(row.sport._ref),
          )
          .map((row) => ({
            _type: "conferenceAffiliation",
            _key: key(),
            sport: reference(row.sport?._ref as string),
            conference: reference(row.conference?._ref as string),
          }));
        if (missing.length) {
          patches.push(
            current.length
              ? at("conferenceAffiliations", insert(missing, "after", -1))
              : at("conferenceAffiliations", set(missing)),
          );
        }
      }

      for (const field of RETIRED[doc._type] ?? []) {
        if (doc[field] !== undefined) patches.push(at(field, unset()));
      }
      return patches;
    },
  },
});
