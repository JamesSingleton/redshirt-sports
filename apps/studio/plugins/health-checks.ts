import { LIMITS } from "@/house-rules/limits";

/**
 * Published content that breaks a house rule the dataset can answer for.
 * The editorial health widget counts each one, and each has a list under
 * Newsroom → Needs attention.
 */
export const HEALTH_CHECKS = [
  {
    id: "no-sport-or-level",
    title: "Articles with no sport or division",
    filter: `_type == "post" && (!defined(sport) || !defined(classification))`,
  },
  {
    id: "no-alt",
    title: "Articles whose lead image has no alt text",
    filter: `_type == "post" && !defined(image.alt)`,
  },
  {
    id: "long-headline-no-seo-title",
    title: "Long headlines with no SEO title",
    filter: `_type == "post" && length(title) > ${LIMITS.seoTitle.max} && !defined(seoTitle)`,
  },
  {
    id: "old-links",
    title: "Articles with old-format links",
    // Same rule as `isLegacyLink`: an old annotation type, or a `link` from
    // before `linkType`. Only blocks with `markDefs`: photos and embeds have
    // none, and `body[].markDefs[...]` would count their nulls as matches.
    filter: `_type == "post" && count(body[defined(markDefs)].markDefs[][_type in ["customLink", "internalLink", "customUrl"] || (_type == "link" && !defined(linkType)) || defined(customUrl)]) > 0`,
  },
  {
    id: "no-teams",
    title: "Articles with no teams tagged",
    filter: `_type == "post" && count(coalesce(teams, [])) == 0`,
  },
  {
    id: "no-tags",
    title: "Articles with no tags",
    filter: `_type == "post" && count(coalesce(tags, [])) == 0`,
  },
  {
    id: "conference-no-level",
    title: "Conferences with no division",
    filter: `_type == "conference" && !defined(primaryClassification)`,
  },
  {
    id: "school-no-conference",
    title: "Schools with no conference",
    filter: `_type == "school" && count(coalesce(conferenceAffiliations, [])) == 0`,
  },
] as const;
