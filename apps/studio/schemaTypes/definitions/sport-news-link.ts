import { defineField, defineType } from "sanity";

import { createRadioListLayout } from "../../utils/helper";

export const sportNewsLink = defineType({
  name: "sportNewsLink",
  title: "Sport news archive link",
  type: "object",
  description:
    "Link to a sport news listing page (/college/{sport}/news/...). This is not for school or team pages.",
  fields: [
    defineField({
      name: "sport",
      title: "Sport",
      type: "reference",
      to: [{ type: "sport" }],
      options: { disableNew: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "routeDepth",
      title: "Page depth",
      type: "string",
      description: "How specific the news archive link should be",
      options: createRadioListLayout([
        { title: "Sport news hub", value: "sportNews" },
        { title: "Division or subgrouping", value: "divisionNews" },
        { title: "Conference", value: "conferenceNews" },
      ]),
      initialValue: () => "sportNews",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "segment",
      title: "Division or subgrouping",
      type: "reference",
      description:
        "The division or sport subgrouping segment used in the URL (e.g. fbs, power-conference)",
      to: [{ type: "division" }, { type: "sportSubgrouping" }],
      options: {
        disableNew: true,
        filter: ({ parent }) => {
          const sportRef = (parent as { sport?: { _ref?: string } })?.sport
            ?._ref;
          if (!sportRef) {
            return { filter: "false" };
          }
          return {
            filter:
              "_type == 'division' || (_type == 'sportSubgrouping' && $sportId in applicableSports[]._ref)",
            params: { sportId: sportRef },
          };
        },
      },
      hidden: ({ parent }) => {
        const routeDepth = (parent as { routeDepth?: string })?.routeDepth;
        return routeDepth === "sportNews" || !routeDepth;
      },
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const routeDepth = (parent as { routeDepth?: string })?.routeDepth;
          if (
            (routeDepth === "divisionNews" ||
              routeDepth === "conferenceNews") &&
            !value?._ref
          ) {
            return "Division or subgrouping is required";
          }
          return true;
        }),
      ],
    }),
    defineField({
      name: "conference",
      title: "Conference",
      type: "reference",
      to: [{ type: "conference" }],
      options: {
        disableNew: true,
        filter: ({ parent }) => {
          const sportRef = (parent as { sport?: { _ref?: string } })?.sport
            ?._ref;
          const segmentRef = (parent as { segment?: { _ref?: string } })
            ?.segment?._ref;
          if (!sportRef || !segmentRef) {
            return { filter: "false" };
          }
          return {
            filter: `$sportId in sports[]._ref && (division._ref == $segmentId || count(sportSubdivisionAffiliations[subgrouping._ref == $segmentId && sport._ref == $sportId]) > 0)`,
            params: { sportId: sportRef, segmentId: segmentRef },
          };
        },
      },
      hidden: ({ parent }) =>
        (parent as { routeDepth?: string })?.routeDepth !== "conferenceNews",
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const routeDepth = (parent as { routeDepth?: string })?.routeDepth;
          if (routeDepth === "conferenceNews" && !value?._ref) {
            return "Conference is required";
          }
          return true;
        }),
      ],
    }),
  ],
  preview: {
    select: {
      sportTitle: "sport.title",
      sportSlug: "sport.slug.current",
      routeDepth: "routeDepth",
      segmentSlug: "segment.slug.current",
      conferenceSlug: "conference.slug.current",
    },
    prepare({
      sportTitle,
      sportSlug,
      routeDepth,
      segmentSlug,
      conferenceSlug,
    }) {
      let path = sportSlug ? `/college/${sportSlug}/news` : "Incomplete link";
      if (routeDepth === "divisionNews" && segmentSlug) {
        path = `/college/${sportSlug}/news/${segmentSlug}`;
      } else if (
        routeDepth === "conferenceNews" &&
        segmentSlug &&
        conferenceSlug
      ) {
        path = `/college/${sportSlug}/news/${segmentSlug}/${conferenceSlug}`;
      }
      return {
        title: sportTitle ?? "Sport news archive",
        subtitle: path,
      };
    },
  },
});
