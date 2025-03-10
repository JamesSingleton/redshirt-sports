import { defineArrayMember, defineField, defineType } from 'sanity'

import { PathnameFieldComponent } from '../../components/slug-field-component'
import { GROUPS, GROUP } from '../../utils/constant'
import { ogFields } from '../../utils/og-fields'
import { seoFields } from '../../utils/seo-fields'
import { createSlug, isUnique } from '../../utils/slug'
import { TextInputWithLimits } from '../../components/text-input-with-limits'
import { StringInputWithLimits } from '../../components/string-input-with-limits'

export const post = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: GROUPS,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description:
        'Make it as enticing as possible to convert users in social feeds and Google searches. Ideally between 15 and 70 characters.',
      group: GROUP.MAIN_CONTENT,
      validation: (rule) => rule.required(),
      components: {
        input: StringInputWithLimits,
      },
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'URL',
      group: GROUP.MAIN_CONTENT,
      components: {
        field: PathnameFieldComponent,
      },
      options: {
        source: 'title',
        slugify: createSlug,
        isUnique,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
      validation: (rule) => rule.required(),
      options: {
        filter: 'archived != true',
        disableNew: true,
      },
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: 'authors',
      title: 'Authors',
      type: 'array',
      description:
        'If only you wrote the article, select yourself. Otherwise, select the authors that contributed to the article.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [
            {
              type: 'author',
              options: {
                disableNew: true,
              },
            },
          ],
          options: {
            disableNew: true,
          },
        }),
      ],
      validation: (rule) => [rule.required(), rule.unique()],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      title: 'Published At',
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: 'mainImage',
      title: 'Image',
      type: 'image',
      description:
        'Please provide an image for the article. Use something like https://squoosh.app or https://tinypng.com to compress the image first.',
      group: GROUP.MAIN_CONTENT,
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'Just a brief description of the image.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'attribution',
          type: 'string',
          title: 'Attribution',
          description: 'Who took the photo or where did you get the photo?',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      title: 'Division',
      name: 'division',
      description: 'What division does this article belong to?',
      type: 'reference',
      to: [{ type: 'division' }],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      title: 'Conferences',
      name: 'conferences',
      description: 'What conferences does this article mention?',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'conference' }],
          options: {
            filter: ({ document }) => ({
              filter: 'division._ref == $divisionId',
              params: {
                // @ts-expect-error this actually works, just types are messed up from Sanity
                divisionId: document?.division?._ref,
              },
            }),
          },
        }),
      ],
      hidden: ({ document }) => !document?.division,
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      title: 'Teams Mentioned',
      name: 'teams',
      description: 'What teams does this article mention?',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'school' }],
        }),
      ],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      title: 'Tags',
      name: 'tags',
      description:
        'Add tags to help with the "Related Articles" section on a post. Especially if you are not adding a conference or division.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'tag' }],
        }),
      ],
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      title: 'Is this a featured article?',
      description: 'Only select Featured if it has been discussed with everyone on the team.',
      name: 'featuredArticle',
      type: 'boolean',
      initialValue: false,
      group: GROUP.MAIN_CONTENT,
    }),
    defineField({
      name: 'excerpt',
      title: 'Article Excerpt',
      type: 'text',
      description:
        'This will be used for article snippets in social media and Google searches. Ideally between 140 and 160 characters.',
      group: GROUP.MAIN_CONTENT,
      validation: (rule) => [
        rule.required(),
        rule
          .min(140)
          .warning(
            'Excerpt should be at least 140 characters for optimal SEO visibility in search results.',
          ),
        rule
          .max(160)
          .warning(
            'Excerpt should not exceed 160 characters as it will be truncated in search results.',
          ),
      ],
      components: {
        input: TextInputWithLimits,
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: GROUP.MAIN_CONTENT,
      validation: (rule) => rule.required(),
    }),
    ...seoFields,
    ...ogFields,
  ],
  preview: {
    select: {
      title: 'title',
      media: 'mainImage',
      date: 'publishedAt',
    },
    prepare: ({ title, media, date }) => ({
      title,
      media,
      // add subtitle to preview but only if it's defined
      subtitle: date
        ? `on ${
            date &&
            new Date(date).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          }`
        : 'Missing publish date',
    }),
  },
})
