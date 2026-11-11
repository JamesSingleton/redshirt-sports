import {
  at,
  defineMigration,
  type NodePatch,
  set,
  unset,
} from "sanity/migrate";

/**
 * Repairs article coverage fields where the right answer can be worked out
 * from the article itself:
 *
 * 1. No sport, but a subdivision that belongs to one sport (FCS → football):
 *    set the sport, unless a tagged conference doesn't play that sport
 *    (an FCS tag on a West Coast Conference article is a mistake, not a
 *    football article); then step 2 removes the subdivision instead.
 * 2. A subdivision from another division or sport (FBS on a Division III
 *    article): remove it. The subdivision was wrong, and it hid the article
 *    from the news page it belongs on.
 * 3. A sport and division but no subdivision, where every tagged conference
 *    plays in the same subdivision for that sport: set it.
 * 4. "Last updated" before "First published" (left behind by duplicating an
 *    article): remove it.
 *
 * Articles without a sport or division are left alone: some cover Division I
 * or college sports as a whole. Run after editorial-01.
 */

type Ref = { _ref?: string };
type Subgrouping = { _id: string; sports: string[]; classification?: string };
type Data = {
  subgroupings: Subgrouping[];
  conferences: Array<{
    _id: string;
    sports: string[];
    rows: Array<{ sport?: string; subgrouping?: string }>;
  }>;
  /** Retired division → classification with the same slug. */
  divisionToClassification: Array<{
    division: string;
    classification?: string;
  }>;
};

let dataPromise: Promise<Data> | undefined;

export default defineMigration({
  title: "Repair article sport, division, and subdivision",
  documentTypes: ["post"],
  migrate: {
    async document(doc, context) {
      dataPromise ??= context.client.fetch<Data>(`{
        "subgroupings": *[_type == "sportSubgrouping" && !(_id in path("drafts.**"))]{
          _id,
          "sports": coalesce(applicableSports[]._ref, []),
          "classification": parentClassification._ref
        },
        "conferences": *[_type == "conference" && !(_id in path("drafts.**"))]{
          _id,
          "sports": coalesce(sports[]._ref, []),
          "rows": coalesce(sportSubdivisionAffiliations[]{"sport": sport._ref, "subgrouping": subgrouping._ref}, [])
            + coalesce(sportSubdivisions[]{"sport": sport._ref, "subgrouping": subdivision._ref}, [])
        },
        "divisionToClassification": *[_type == "division"]{
          "division": _id,
          "classification": *[_type == "classification" && slug.current == ^.slug.current && !(_id in path("drafts.**"))][0]._id
        }
      }`);
      const data = await dataPromise;
      const subgroupings = new Map(data.subgroupings.map((s) => [s._id, s]));
      const conferences = new Map(data.conferences.map((c) => [c._id, c.rows]));
      const conferenceSports = new Map(
        data.conferences.map((c) => [c._id, c.sports]),
      );
      const fromDivision = new Map(
        data.divisionToClassification.map((d) => [
          d.division,
          d.classification,
        ]),
      );

      const patches: NodePatch[] = [];
      let sport = (doc.sport as Ref | undefined)?._ref;
      const classification =
        (doc.classification as Ref | undefined)?._ref ??
        fromDivision.get((doc.division as Ref | undefined)?._ref ?? "");
      let subgroupingId = (doc.sportSubgrouping as Ref | undefined)?._ref;
      const subgrouping = subgroupingId
        ? subgroupings.get(subgroupingId)
        : undefined;

      const conferenceIds = ((doc.conferences ?? []) as Ref[])
        .map((ref) => ref._ref)
        .filter(Boolean) as string[];
      // 1. The subdivision names the sport, if the conferences play it.
      if (!sport && subgrouping?.sports.length === 1) {
        const implied = subgrouping.sports[0];
        const conferencesPlayIt = conferenceIds.every((id) =>
          (conferenceSports.get(id) ?? []).includes(implied),
        );
        if (conferencesPlayIt) {
          sport = implied;
          patches.push(at("sport", set({ _type: "reference", _ref: sport })));
        } else {
          patches.push(at("sportSubgrouping", unset()));
          subgroupingId = undefined;
        }
      }

      // 2. A subdivision from another division or sport.
      if (
        subgroupingId &&
        (!subgrouping ||
          (classification && subgrouping.classification !== classification) ||
          (sport && !subgrouping.sports.includes(sport)))
      ) {
        patches.push(at("sportSubgrouping", unset()));
        subgroupingId = undefined;
      }

      // 3. Every tagged conference agrees on the subdivision.
      if (!subgroupingId && sport && classification && conferenceIds.length) {
        const answers = conferenceIds.map(
          (id) =>
            (conferences.get(id) ?? []).find(
              (row) =>
                row.sport === sport &&
                row.subgrouping &&
                subgroupings.get(row.subgrouping)?.classification ===
                  classification,
            )?.subgrouping,
        );
        const unique = new Set(answers);
        const [only] = [...unique];
        if (unique.size === 1 && only) {
          patches.push(
            at("sportSubgrouping", set({ _type: "reference", _ref: only })),
          );
        }
      }

      // 4. Updated before it was published.
      const publishedAt = doc.publishedAt as string | undefined;
      const modifiedAt = doc.modifiedAt as string | undefined;
      if (publishedAt && modifiedAt && modifiedAt < publishedAt) {
        patches.push(at("modifiedAt", unset()));
      }
      return patches;
    },
  },
});
