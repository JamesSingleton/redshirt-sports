import {
  at,
  defineMigration,
  insert,
  setIfMissing,
  unset,
} from "sanity/migrate";

/**
 * A conference recorded its subdivision per sport in two fields. Keeps
 * `sportSubdivisionAffiliations` (the one the site reads), copies over any
 * sport that only `sportSubdivisions` had, and removes `sportSubdivisions`.
 */

type Ref = { _type?: string; _ref?: string };
type OldRow = { _key?: string; sport?: Ref; subdivision?: Ref };
type Row = { _key?: string; sport?: Ref; subgrouping?: Ref };

const key = () => Math.random().toString(36).slice(2, 14);

export default defineMigration({
  title: "Merge conference sportSubdivisions into sportSubdivisionAffiliations",
  documentTypes: ["conference"],
  filter: "defined(sportSubdivisions)",
  migrate: {
    document(doc) {
      const old = (doc.sportSubdivisions ?? []) as OldRow[];
      const current = (doc.sportSubdivisionAffiliations ?? []) as Row[];
      const covered = new Set(current.map((row) => row.sport?._ref));

      const missing = old
        .filter(
          (row) =>
            row.sport?._ref &&
            row.subdivision?._ref &&
            !covered.has(row.sport._ref),
        )
        .map((row) => ({
          _type: "sportSubgroupingAffiliation",
          _key: key(),
          sport: { _type: "reference", _ref: row.sport?._ref as string },
          subgrouping: {
            _type: "reference",
            _ref: row.subdivision?._ref as string,
          },
        }));

      return [
        ...(missing.length
          ? [
              at("sportSubdivisionAffiliations", setIfMissing([])),
              at("sportSubdivisionAffiliations", insert(missing, "after", -1)),
            ]
          : []),
        at("sportSubdivisions", unset()),
      ];
    },
  },
});
