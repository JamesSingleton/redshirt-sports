import { at, defineMigration, set } from "sanity/migrate";

import type { BodyBlock } from "../../house-rules/types";
import {
  changedBlocks,
  convertLegacyLinks,
  type LinkLookup,
} from "../../utils/body-transforms";

/**
 * Converts every old link format in article and legal bodies (`link` with an
 * `href`, `internalLink`, `customLink`, and a flat `customUrl`) to the one
 * `link` annotation:
 *
 * - links to our own domain, written as full URLs, become site paths
 * - references to articles, teams, authors, and legal pages stay references
 * - references to conferences and divisions, which have no page of their own
 *   and render as "#" today, become the matching news page path
 * - a link with no destination is removed; its text stays
 */

type Conference = {
  _id: string;
  slug?: string;
  sports?: string[];
  levelSlug?: string;
  subdivisions?: Array<{ sport?: string; slug?: string }>;
};

type Data = {
  types: Array<{ _id: string; _type: string }>;
  conferences: Conference[];
  levels: Array<{ _id: string; slug?: string }>;
  sports: Array<{ _id: string; slug?: string }>;
  subgroupings: Array<{ _id: string; slug?: string }>;
};

let lookupPromise:
  | Promise<{ lookup: LinkLookup; sportSlug: Map<string, string> }>
  | undefined;

function buildLookup(data: Data) {
  const typeOf = new Map(data.types.map((doc) => [doc._id, doc._type]));
  const conferences = new Map(data.conferences.map((c) => [c._id, c]));
  const levelSlug = new Map(data.levels.map((l) => [l._id, l.slug]));
  const sportSlug = new Map(
    data.sports.map((s) => [s._id, s.slug ?? ""] as const),
  );
  const segmentSlug = new Map([
    ...data.levels.map((l) => [l._id, l.slug] as const),
    ...data.subgroupings.map((s) => [s._id, s.slug] as const),
  ]);

  const sportNews = (sport: string, segment?: string, conference?: string) => {
    if (!segment || segment === "d1") return `/college/${sport}/news`;
    return conference
      ? `/college/${sport}/news/${segment}/${conference}`
      : `/college/${sport}/news/${segment}`;
  };

  const lookup: LinkLookup = {
    typeOf: (id) => typeOf.get(id),
    newsPath(id, articleSport) {
      const conference = conferences.get(id);
      if (conference?.slug) {
        const sport =
          articleSport && conference.sports?.includes(articleSport)
            ? articleSport
            : (conference.sports?.[0] ?? "football");
        const segment =
          conference.subdivisions?.find((row) => row.sport === sport)?.slug ??
          conference.levelSlug;
        return segment && segment !== "d1"
          ? sportNews(sport, segment, conference.slug)
          : sportNews(sport);
      }
      const level = levelSlug.get(id);
      return level ? sportNews(articleSport ?? "football", level) : null;
    },
    sportNewsPath(link) {
      const ref = (value: unknown) => (value as { _ref?: string })?._ref;
      const sport = sportSlug.get(ref(link.sport) ?? "");
      if (!sport) return null;
      const segment = segmentSlug.get(ref(link.segment) ?? "");
      const conference = conferences.get(ref(link.conference) ?? "")?.slug;
      if (link.routeDepth === "conferenceNews" && segment && conference) {
        return `/college/${sport}/news/${segment}/${conference}`;
      }
      if (link.routeDepth === "divisionNews" && segment) {
        return `/college/${sport}/news/${segment}`;
      }
      return `/college/${sport}/news`;
    },
  };
  return { lookup, sportSlug };
}

export default defineMigration({
  title: "Convert legacy body links to the link annotation",
  documentTypes: ["post", "legal"],
  filter: "defined(body)",
  migrate: {
    async document(doc, context) {
      lookupPromise ??= context.client
        .fetch<Data>(`{
          "types": *[_type in ["post", "school", "author", "legal", "conference", "division", "classification"] && !(_id in path("drafts.**"))]{_id, _type},
          "conferences": *[_type == "conference" && !(_id in path("drafts.**"))]{
            _id,
            "slug": slug.current,
            "sports": sports[]->slug.current,
            "levelSlug": coalesce(primaryClassification->slug.current, division->slug.current),
            "subdivisions": coalesce(sportSubdivisionAffiliations[]{"sport": sport->slug.current, "slug": subgrouping->slug.current}, [])
              + coalesce(sportSubdivisions[]{"sport": sport->slug.current, "slug": subdivision->slug.current}, [])
          },
          "levels": *[_type in ["division", "classification"]]{_id, "slug": slug.current},
          "sports": *[_type == "sport"]{_id, "slug": slug.current},
          "subgroupings": *[_type == "sportSubgrouping"]{_id, "slug": slug.current}
        }`)
        .then(buildLookup);
      const { lookup, sportSlug } = await lookupPromise;

      const articleSport = sportSlug.get(
        (doc.sport as { _ref?: string } | undefined)?._ref ?? "",
      );
      const body = (doc.body ?? []) as BodyBlock[];
      return changedBlocks(
        body,
        convertLegacyLinks(body, lookup, articleSport),
      ).map((block) => at(["body", { _key: block._key }], set(block)));
    },
  },
});
