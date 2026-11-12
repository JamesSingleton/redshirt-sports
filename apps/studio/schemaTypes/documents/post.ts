import { CheckmarkCircleIcon } from "@sanity/icons/CheckmarkCircle";
import { ComposeIcon } from "@sanity/icons/Compose";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { HelpCircleIcon } from "@sanity/icons/HelpCircle";
import { SearchIcon } from "@sanity/icons/Search";
import { TiersIcon } from "@sanity/icons/Tiers";
import {
  defineArrayMember,
  defineField,
  defineType,
  type Reference,
  type ValidationContext,
} from "sanity";

import { BodyInput } from "@/components/body-input";
import { budgetInput } from "@/components/text-budget-input";
import { bodyFindings } from "@/house-rules/body";
import { LIMITS } from "@/house-rules/limits";
import {
  bylineFindings,
  correctionFindings,
  coverageFindings,
  faqFindings,
  GAME_STORY_TYPES,
  keyTakeawayFindings,
  type PostLike,
  STORY_TYPES,
  type StoryType,
  storyTypeTitle,
} from "@/house-rules/post";
import { houseRule } from "@/house-rules/sanity";
import {
  excerptFindings,
  headlineFindings,
  heroImageFindings,
} from "@/house-rules/text";
import type { BodyBlock, Finding } from "@/house-rules/types";
import { documentSlugField } from "@/schemaTypes/common";
import { API_VERSION } from "@/utils/constant";
import { authorsForUser } from "@/utils/current-user";
import { editorialImageFields } from "../shared/image-fields";
import { seoFields } from "../shared/seo-fields";

const GROUP = {
  STORY: "article",
  COVERAGE: "coverage",
  ANSWERS: "answers",
  SEO: "seo",
  STANDARDS: "standards",
} as const;

const refOf = (value: unknown) => (value as Reference | undefined)?._ref;
const postOf = (context: ValidationContext) =>
  (context.document ?? {}) as PostLike;

/** Findings from a document-level rule that belong on one field. */
const only = (findings: Finding[], prefix: string) =>
  findings.filter((finding) => finding.rule.startsWith(prefix));

export const post = defineType({
  name: "post",
  title: "Article",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: GROUP.STORY, title: "Article", icon: ComposeIcon, default: true },
    { name: GROUP.COVERAGE, title: "Coverage", icon: TiersIcon },
    { name: GROUP.ANSWERS, title: "Takeaways & FAQ", icon: HelpCircleIcon },
    { name: GROUP.SEO, title: "Search & social", icon: SearchIcon },
    { name: GROUP.STANDARDS, title: "Standards", icon: CheckmarkCircleIcon },
  ],
  fieldsets: [
    {
      name: "level",
      title: "Sport & division",
      description:
        "Together these decide which news page the article lands on: football + NCAA Division I + FCS → /college/football/news/fcs. Leave the sport empty for an article about a whole division or college sports in general.",
    },
  ],
  fields: [
    // --- Article -----------------------------------------------------------
    defineField({
      name: "title",
      title: "Headline",
      type: "string",
      group: GROUP.STORY,
      description: `Name the team or person and say what happened. Aim for ${LIMITS.headline.ideal} characters or fewer; ${LIMITS.headline.max} is the limit.`,
      components: {
        input: budgetInput({
          max: LIMITS.headline.max,
          ideal: LIMITS.headline.ideal,
          min: LIMITS.headline.min,
        }),
      },
      validation: (rule) =>
        houseRule<string, typeof rule>(
          rule,
          (value) => headlineFindings(value),
          { required: "Every article needs a headline." },
        ),
    }),
    documentSlugField("post", {
      group: GROUP.STORY,
      required: true,
      description:
        "The article's web address, made from the headline. Don't change it after publishing unless the headline was wrong; a redirect is created if you do.",
    }),
    defineField({
      name: "storyType",
      title: "Article type",
      type: "string",
      group: GROUP.STORY,
      description:
        "What kind of article this is. Shown as a label on the site, and it tells readers whether they're reading reporting or opinion.",
      options: { list: [...STORY_TYPES], layout: "dropdown" },
      initialValue: "news",
      validation: (rule) => rule.required().error("Pick an article type."),
    }),
    defineField({
      name: "authors",
      title: "Byline",
      type: "array",
      group: GROUP.STORY,
      description: `Who wrote it, in byline order. Up to ${LIMITS.authors.max}.`,
      // A new article starts with whoever is creating it, when their Studio
      // account is linked to an author (or their name matches one exactly).
      initialValue: (_params, context) =>
        authorsForUser(
          context.currentUser,
          context.getClient({ apiVersion: API_VERSION }),
        ),
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "author" }],
          options: { disableNew: true, filter: "archived != true" },
        }),
      ],
      validation: (rule) =>
        houseRule<Reference[], typeof rule>(
          rule,
          (value, context) =>
            bylineFindings(value, postOf(context).contributors),
          { required: "Add at least one author to the byline." },
        ),
    }),
    defineField({
      name: "image",
      title: "Lead image",
      type: "image",
      group: GROUP.STORY,
      description: `The photo at the top of the article and on every card that links to it. Landscape, ${LIMITS.heroImage.minWidth}px wide or more. Set the hotspot on the subject so crops keep them in frame.`,
      options: { hotspot: true },
      fields: editorialImageFields,
      validation: (rule) => [
        rule
          .required()
          .error("Add a lead image. Articles don't run without one."),
        rule
          .custom((value: { asset?: Reference } | undefined) => {
            const findings = heroImageFindings(value?.asset?._ref);
            return findings.length
              ? findings.map((finding) => finding.message).join(" ")
              : true;
          })
          .warning(),
      ],
    }),
    defineField({
      name: "excerpt",
      title: "Summary",
      type: "text",
      rows: 3,
      group: GROUP.STORY,
      description: `The line under the headline on cards, in search results, and in social previews. Written for you from the body a few seconds after you start; edit it, or clear it to regenerate. ${LIMITS.excerpt.idealMin} to ${LIMITS.excerpt.idealMax} characters reads best.`,
      components: {
        input: budgetInput({
          max: LIMITS.excerpt.max,
          ideal: LIMITS.excerpt.idealMax,
          min: LIMITS.excerpt.idealMin,
        }),
      },
      validation: (rule) =>
        houseRule<string, typeof rule>(
          rule,
          (value, context) => excerptFindings(value, postOf(context).title),
          {
            required:
              "Add a summary. It is generated from the body a few seconds after you start writing.",
          },
        ),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
      group: GROUP.STORY,
      description:
        "Open with the news in one paragraph. Use Heading 2 for sections and Heading 3 inside a section.",
      components: { input: BodyInput },
      validation: (rule) =>
        houseRule<BodyBlock[], typeof rule>(
          rule,
          (value) => bodyFindings(value),
          { required: "Write the article before publishing." },
        ),
    }),

    // --- Coverage --------------------------------------------------------
    defineField({
      name: "sport",
      type: "reference",
      to: [{ type: "sport" }],
      group: GROUP.COVERAGE,
      fieldset: "level",
      description: "Leave empty only when the article isn't about one sport.",
      options: { disableNew: true },
      validation: (rule) =>
        houseRule<Reference, typeof rule>(rule, (_, context) =>
          only(coverageFindings(postOf(context)), "coverage.sport"),
        ),
    }),
    defineField({
      name: "classification",
      title: "Division",
      type: "reference",
      to: [{ type: "classification" }],
      group: GROUP.COVERAGE,
      fieldset: "level",
      description: "NCAA Division I, NCAA Division II, NAIA, and so on.",
      options: { disableNew: true },
      validation: (rule) =>
        houseRule<Reference, typeof rule>(rule, (_, context) =>
          only(coverageFindings(postOf(context)), "coverage.classification"),
        ),
    }),
    defineField({
      name: "sportSubgrouping",
      title: "Subdivision",
      type: "reference",
      to: [{ type: "sportSubgrouping" }],
      group: GROUP.COVERAGE,
      fieldset: "level",
      description:
        "Shown when the sport is split within the division: FBS or FCS for Division I football, Power Conferences or Mid-Major for Division I basketball. Leave empty if the article covers both.",
      hidden: ({ document }) => !document?.sport || !document?.classification,
      options: {
        disableNew: true,
        filter: ({ document }) => {
          const sportId = refOf(document.sport);
          const classificationId = refOf(document.classification);
          if (!sportId || !classificationId) return { filter: "false" };
          return {
            filter:
              "parentClassification._ref == $classificationId && $sportId in applicableSports[]._ref",
            params: { sportId, classificationId },
          };
        },
      },
      validation: (rule) => {
        type Option = { _id: string; shortName?: string; name?: string };
        const optionsFor = async (context: ValidationContext) => {
          const sportId = refOf(context.document?.sport);
          const classificationId = refOf(context.document?.classification);
          if (!sportId || !classificationId) return null;
          return context
            .getClient({ apiVersion: API_VERSION })
            .fetch<Option[]>(
              `*[_type == "sportSubgrouping" && parentClassification._ref == $classificationId && $sportId in applicableSports[]._ref]{_id, shortName, name}`,
              { sportId, classificationId },
            );
        };
        const names = (options: Option[]) =>
          options.map((option) => option.shortName ?? option.name).join(" or ");

        return [
          rule.custom(async (value, context) => {
            if (!value?._ref) return true;
            const options = await optionsFor(context);
            if (!options) return true;
            if (options.length === 0) {
              return "This sport isn't split within this division. Clear this field.";
            }
            return options.some((option) => option._id === value._ref)
              ? true
              : `That subdivision isn't part of this sport and division. Pick ${names(options)}.`;
          }),
          rule
            .custom(async (value, context) => {
              if (value?._ref) return true;
              const options = await optionsFor(context);
              return options?.length
                ? `No subdivision, so the article appears on the sport's division-wide pages only. Pick ${names(options)} if it's about one of them.`
                : true;
            })
            .warning(),
        ];
      },
    }),
    defineField({
      name: "conferences",
      type: "array",
      group: GROUP.COVERAGE,
      description:
        "Conferences the article is about, not every one it mentions. Puts the article on each conference's news page.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "conference" }],
          options: {
            disableNew: true,
            filter: ({ document }) => {
              const sportId = refOf(document.sport);
              const classificationId = refOf(document.classification);
              if (!sportId || !classificationId) return { filter: "true" };
              return {
                filter:
                  "primaryClassification._ref == $classificationId && (count(coalesce(sports, [])) == 0 || $sportId in sports[]._ref)",
                params: { sportId, classificationId },
              };
            },
          },
        }),
      ],
      validation: (rule) => [
        ...houseRule<Reference[], typeof rule>(rule, (_, context) =>
          only(coverageFindings(postOf(context)), "coverage.conference"),
        ),
        rule
          .custom(async (value: Reference[] | undefined, context) => {
            const sportId = refOf(context.document?.sport);
            const subgroupingId = refOf(context.document?.sportSubgrouping);
            const ids = (value ?? []).map((item) => item._ref).filter(Boolean);
            if (!sportId || !subgroupingId || ids.length === 0) return true;

            const mismatched = await context
              .getClient({ apiVersion: API_VERSION })
              .fetch<string[]>(
                `*[_type == "conference" && _id in $ids && count(sportSubdivisionAffiliations[sport._ref == $sportId]) > 0 && count(sportSubdivisionAffiliations[sport._ref == $sportId && subgrouping._ref == $subgroupingId]) == 0].name`,
                { ids, sportId, subgroupingId },
              );
            return mismatched.length > 0
              ? `${mismatched.join(", ")} ${mismatched.length === 1 ? "plays" : "play"} in a different subdivision for this sport, so this article won't appear on ${mismatched.length === 1 ? "its" : "their"} news page.`
              : true;
          })
          .warning(),
      ],
    }),
    defineField({
      name: "teams",
      type: "array",
      group: GROUP.COVERAGE,
      description:
        "Teams the article is about. Each one gets the article on its team page, so skip teams that are only mentioned in passing.",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "school" }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) =>
        houseRule<Reference[], typeof rule>(rule, (_, context) =>
          only(coverageFindings(postOf(context)), "coverage.team").concat(
            only(coverageFindings(postOf(context)), "coverage.game"),
          ),
        ),
    }),
    defineField({
      name: "game",
      type: "gameRef",
      group: GROUP.COVERAGE,
      description:
        "The game this preview or recap covers. Search by team. Games come from the scores database, not Sanity.",
      hidden: ({ document }) =>
        !GAME_STORY_TYPES.includes(document?.storyType as StoryType),
      validation: (rule) =>
        houseRule<string, typeof rule>(rule, (_, context) =>
          only(coverageFindings(postOf(context)), "coverage.game"),
        ),
    }),
    defineField({
      name: "players",
      type: "array",
      group: GROUP.COVERAGE,
      description:
        "Players the article is about. Search by name; profiles come from ESPN and are never stored in Sanity.",
      of: [defineArrayMember({ type: "playerRef" })],
      validation: (rule) =>
        houseRule<string[], typeof rule>(rule, (_, context) =>
          only(coverageFindings(postOf(context)), "coverage.player"),
        ),
    }),
    defineField({
      name: "tags",
      type: "array",
      group: GROUP.COVERAGE,
      description: `Recurring topics such as "Coaching Changes". Up to ${LIMITS.tags.max}. Suggested from the body automatically when left empty.`,
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "tag" }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) =>
        houseRule<Reference[], typeof rule>(rule, (_, context) =>
          only(coverageFindings(postOf(context)), "coverage.tag"),
        ),
    }),

    // --- Takeaways & FAQ ---------------------------------------------------
    defineField({
      name: "keyTakeaways",
      type: "array",
      group: GROUP.ANSWERS,
      description: `${LIMITS.keyTakeaways.min} to ${LIMITS.keyTakeaways.max} one-sentence facts a reader should leave with, most important first. Shown at the top of long articles, and the lines search engines and AI assistants are most likely to quote.`,
      of: [
        defineArrayMember({
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) =>
        houseRule<string[], typeof rule>(rule, (value) =>
          keyTakeawayFindings(value),
        ),
    }),
    defineField({
      name: "faqs",
      title: "Questions & answers",
      type: "array",
      group: GROUP.ANSWERS,
      description:
        "Questions readers actually search for, each answered in two or three sentences. Use on explainers and evergreen articles, not on game recaps.",
      of: [
        defineArrayMember({
          name: "faq",
          title: "Question",
          type: "object",
          icon: HelpCircleIcon,
          fields: [
            defineField({
              name: "question",
              type: "string",
              description:
                'Phrase it the way a fan would type it, e.g. "How many teams make the FCS playoffs?"',
            }),
            defineField({
              name: "answer",
              type: "text",
              rows: 3,
              description:
                "Lead with the direct answer, then one supporting fact.",
            }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
      validation: (rule) =>
        houseRule<PostLike["faqs"], typeof rule>(rule, (value) =>
          faqFindings(value),
        ),
    }),

    // --- Search & social ---------------------------------------------------
    ...seoFields({ group: GROUP.SEO }),

    // --- Standards ---------------------------------------------------------
    defineField({
      name: "publishedAt",
      title: "First published",
      type: "datetime",
      group: GROUP.STANDARDS,
      readOnly: true,
      description: "Set when the article is first published.",
      options: { dateFormat: "MMM D, YYYY", timeFormat: "h:mm A" },
    }),
    defineField({
      name: "modifiedAt",
      title: "Last updated",
      type: "datetime",
      group: GROUP.STANDARDS,
      description:
        "Set automatically when the headline or body changes in substance. Change it only for a real update, not a typo fix.",
      options: { dateFormat: "MMM D, YYYY", timeFormat: "h:mm A" },
      validation: (rule) =>
        rule.custom((value, context) => {
          const publishedAt = postOf(context).publishedAt;
          return value && publishedAt && value < publishedAt
            ? "This is earlier than First published. Clear it; it is set again on the next real update."
            : true;
        }),
    }),
    defineField({
      name: "contributors",
      title: "Contributing reporters",
      type: "array",
      group: GROUP.STANDARDS,
      description:
        'People who reported for the article but didn\'t write it. Credited at the end as "Jane Doe contributed to this report."',
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "author" }],
          options: { disableNew: true },
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "editedBy",
      title: "Edited by",
      type: "reference",
      to: [{ type: "author" }],
      group: GROUP.STANDARDS,
      description:
        "The editor who reviewed the article before it ran. Internal record; also tells search engines the article was reviewed.",
      options: { disableNew: true },
      validation: (rule) =>
        rule
          .custom((value, context) => {
            const authors = (postOf(context).authors ?? []).map(
              (author) => author._ref,
            );
            return value?._ref &&
              authors.length === 1 &&
              authors[0] === value._ref
              ? "The editor is also the only author. Have someone else read it if you can."
              : true;
          })
          .warning(),
    }),
    defineField({
      name: "sources",
      type: "array",
      group: GROUP.STANDARDS,
      description:
        "Documents, releases, and reports the article relies on. Listed at the end of the article. Link them in the body too where they're used.",
      of: [
        defineArrayMember({
          name: "source",
          type: "object",
          fields: [
            defineField({
              name: "title",
              type: "string",
              description:
                'What it is, e.g. "NCAA Division I Council meeting summary".',
              validation: (rule) => rule.required().error("Name the source."),
            }),
            defineField({
              name: "publisher",
              type: "string",
              description: 'Who published it, e.g. "NCAA" or "ESPN".',
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (rule) =>
                rule
                  .required()
                  .uri({ scheme: ["https", "http"] })
                  .error("Add the source's web address."),
            }),
          ],
          preview: {
            select: { title: "title", publisher: "publisher", url: "url" },
            prepare: ({ title, publisher, url }) => ({
              title,
              subtitle: publisher || url,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "editorsNote",
      title: "Editor's note",
      type: "text",
      rows: 3,
      group: GROUP.STANDARDS,
      description:
        "Shown in italics above the article. Use it to disclose a relationship, explain how the article was reported, or flag that it has been updated.",
      validation: (rule) =>
        rule.max(500).error("Keep the editor's note to 500 characters."),
    }),
    defineField({
      name: "corrections",
      type: "array",
      group: GROUP.STANDARDS,
      description:
        "Every factual fix after publication, newest last. Shown at the end of the article. Typos and style fixes don't need one.",
      of: [
        defineArrayMember({
          name: "correction",
          type: "object",
          fields: [
            defineField({
              name: "kind",
              type: "string",
              options: {
                layout: "radio",
                direction: "horizontal",
                list: [
                  { title: "Correction", value: "correction" },
                  { title: "Clarification", value: "clarification" },
                  { title: "Update", value: "update" },
                ],
              },
              initialValue: "correction",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "date",
              type: "datetime",
              initialValue: () => new Date().toISOString(),
            }),
            defineField({
              name: "text",
              type: "text",
              rows: 3,
              description:
                'Say what was wrong and what is right, e.g. "An earlier version of this article misstated Montana\'s record. The Grizzlies are 9-2."',
            }),
          ],
          preview: {
            select: { kind: "kind", date: "date", text: "text" },
            prepare: ({ kind, date, text }) => ({
              title: text ?? "Correction",
              subtitle: [
                kind ? kind[0].toUpperCase() + kind.slice(1) : "Correction",
                date ? new Date(date).toLocaleDateString("en-US") : null,
              ]
                .filter(Boolean)
                .join(" · "),
            }),
          },
        }),
      ],
      validation: (rule) =>
        houseRule<PostLike["corrections"], typeof rule>(
          rule,
          (value, context) =>
            correctionFindings(value, postOf(context).publishedAt),
        ),
    }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "publishedDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
    {
      title: "Recently edited",
      name: "updatedDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
    {
      title: "Headline A-Z",
      name: "titleAsc",
      by: [{ field: "title", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      media: "image",
      date: "publishedAt",
      storyType: "storyType",
      author: "authors.0.name",
      sport: "sport.title",
    },
    prepare: ({ title, media, date, storyType, author, sport }) => {
      const dateLabel = date
        ? new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "Not published";

      return {
        title: title ?? "Untitled article",
        media,
        subtitle: [
          storyTypeTitle(storyType) ?? "News",
          sport,
          author,
          dateLabel,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    },
  },
});
