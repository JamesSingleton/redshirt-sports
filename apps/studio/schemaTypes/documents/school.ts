import { defineField, defineType } from "sanity";

import { SchoolSlugFieldComponent } from "../../components/school-slug-field-component";
import { GROUP, GROUPS } from "../../utils/constant";
import { ogFields } from "../../utils/og-fields";
import {
  createSchoolSlug,
  createSchoolSlugSource,
} from "../../utils/school-slug";
import { seoFields } from "../../utils/seo-fields";
import { isUnique } from "../../utils/slug";
import { documentSlugField } from "../common";
import { socialLinks } from "../definitions/social-links";

export const school = defineType({
  name: "school",
  title: "School",
  type: "document",
  groups: GROUPS,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
      description:
        "The name of the college or university. i.e. Virginia Military Institute",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "shortName",
      title: "Short Name",
      type: "string",
      description:
        "The short name of the college or university. i.e. Virginia Tech",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "abbreviation",
      title: "Abbreviation",
      type: "string",
      description:
        "The abbreviation or shorter version of the college or university. i.e. VMI",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "nickname",
      title: "Nickname",
      description:
        "The nickname of the college or university. i.e. Black Knights",
      type: "string",
      group: GROUP.MAIN_CONTENT,
    }),
    documentSlugField("school", {
      group: GROUP.MAIN_CONTENT,
      title: "Team URL",
      description:
        "Public team hub URL slug (school-nickname), e.g. army-black-knights",
      component: SchoolSlugFieldComponent,
      required: true,
      slugOptions: {
        source: (doc) =>
          createSchoolSlugSource(doc as Record<string, unknown> | undefined),
        slugify: createSchoolSlug,
        isUnique,
      },
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
      description: "The logo of the college or university",
      group: GROUP.MAIN_CONTENT,
      fields: [
        defineField({
          name: "caption",
          title: "Caption",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: "overview",
      title: "Overview",
      type: "text",
      rows: 4,
      description: "Editorial intro copy for the public team hub page.",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "websiteUrl",
      title: "Athletics Website",
      type: "url",
      description: "Official athletics department website.",
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      ...socialLinks,
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "top25VotingEligible",
      title: "Top 25 Voting Eligible",
      type: "boolean",
      description: "Is this school eligible to be voted on in the Top 25?",
      initialValue: true,
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: "conferenceAffiliations",
      title: "Conference Affiliations",
      type: "array",
      description: "What conferences is this school in for each sport?",
      group: GROUP.MAIN_CONTENT,
      of: [
        {
          type: "object",
          name: "conferenceAffiliation",
          title: "Conference Affiliation",
          fields: [
            defineField({
              name: "sport",
              title: "Sport",
              type: "reference",
              to: [{ type: "sport" }],
              validation: (rule) => rule.required(),
              options: {
                disableNew: true,
              },
            }),
            defineField({
              name: "conference",
              title: "Conference",
              type: "reference",
              to: [{ type: "conference" }],
              validation: (rule) => rule.required(),
              options: {
                disableNew: true,
                filter: ({ parent }) => {
                  const sportRef =
                    parent &&
                    !Array.isArray(parent) &&
                    typeof parent === "object"
                      ? (parent as { sport?: { _ref?: string } }).sport?._ref
                      : undefined;

                  if (!sportRef) {
                    return { filter: "true" };
                  }

                  return {
                    filter: "$sportId in sports[]._ref",
                    params: {
                      sportId: sportRef,
                    },
                  };
                },
              },
            }),
          ],
          preview: {
            select: {
              sport: "sport.title",
              conference: "conference.name",
            },
            prepare: ({ sport, conference }) => ({
              title: `${sport || "Unknown Sport"} - ${conference || "Unknown Conference"}`,
            }),
          },
        },
      ],
      validation: (rule) =>
        rule.custom((affiliations: unknown) => {
          if (!affiliations || !Array.isArray(affiliations)) {
            return true;
          }

          const sports = new Set<string>();

          for (const affiliation of affiliations) {
            const sportRef = (affiliation as { sport?: { _ref?: string } })
              ?.sport?._ref;
            if (sportRef) {
              if (sports.has(sportRef)) {
                return "Each sport can only have one conference affiliation";
              }
              sports.add(sportRef);
            }
          }

          return true;
        }),
    }),
    ...seoFields,
    ...ogFields,
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "slug.current",
      media: "image",
    },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle ? `/college/teams/${subtitle}` : "No slug",
      media,
    }),
  },
});
