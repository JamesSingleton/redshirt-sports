import { defineField, defineType } from "sanity";

export const latestRankingsLink = defineType({
  name: "latestRankingsLink",
  title: "Latest rankings link",
  type: "object",
  description:
    "Always links to the most recently published Top 25 poll for this sport and division. The site works out the week, so this never needs updating.",
  fields: [
    defineField({
      name: "sport",
      title: "Sport",
      type: "reference",
      to: [{ type: "sport" }],
      options: { disableNew: true },
      // Required-ness lives on customUrl.latestRankingsLink: this object is
      // auto-initialized on every link, so a rule here fires on external links too.
    }),
    defineField({
      name: "poll",
      title: "Division or subgrouping",
      type: "reference",
      description: "The poll to link to (e.g. FCS, FBS, Mid-Major)",
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
    }),
  ],
  preview: {
    select: {
      sportTitle: "sport.title",
      sportSlug: "sport.slug.current",
      pollSlug: "poll.slug.current",
    },
    prepare({ sportTitle, sportSlug, pollSlug }) {
      return {
        title: sportTitle ?? "Latest rankings",
        subtitle:
          sportSlug && pollSlug
            ? `/college/${sportSlug}/rankings/${pollSlug}/(latest week)`
            : "Incomplete link",
      };
    },
  },
});
