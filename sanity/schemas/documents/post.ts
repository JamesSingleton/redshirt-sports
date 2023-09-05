import { defineType, defineField, defineArrayMember } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'
import CustomStringInputWithLimits from '@plugins/CustomStringInputWithLimits'
import { CustomBlockContentInput } from '@plugins/CustomBlockContentInput'

export default defineType({
  name: 'post',
  title: 'Posts',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description:
        'Make it as enticing as possible to convert users in social feeds and Google searches. Ideally between 15 and 70 characters.',
      validation: (rule) => [
        rule.required().error('We need a title before publishing.'),
        rule.min(32).warning(),
        rule
          .max(52)
          .warning('This is a long title. Try to keep it under 52 characters if possible.'),
      ],
      components: {
        input: CustomStringInputWithLimits,
      },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Press generate to generate the slug automatically, do not manually input slug.',
      options: {
        source: 'title',
        slugify: (input) =>
          input
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-'),
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      // make field read only if there is a title and a slug
      readOnly: ({ document }) => !!document?.title && !!document?.slug,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      description:
        'Please provide an image for the article. Use something like https://squoosh.app or https://tinypng.com to compress the image first.',
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
    // defineField({
    //   title: 'Category',
    //   name: 'category',
    //   description: 'High level category of the article (FBS or FCS)',
    //   type: 'string',
    //   options: {
    //     list: [
    //       {
    //         title: 'FCS',
    //         value: 'FCS',
    //       },
    //       {
    //         title: 'FBS',
    //         value: 'FBS',
    //       },
    //       {
    //         title: 'D2',
    //         value: 'D2',
    //       },
    //     ],
    //     layout: 'radio', // <-- defaults to 'dropdown'
    //   },
    //   validation: (rule) => rule.required(),
    // }),
    // defineField({
    //   title: 'Category',
    //   name: 'parentCategory',
    //   description: 'What category does this article belong in?',
    //   type: 'reference',
    //   to: [{ type: 'category' }],
    //   options: { filter: '!defined(parent)' },
    //   validation: (rule) => rule.required(),
    // }),
    // defineField({
    //   title: 'Subcategory',
    //   name: 'subcategory',
    //   description:
    //     "What subcategory does this article belong to? Ideally a conference (if it isn't in the list, add it)",
    //   type: 'reference',
    //   to: [{ type: 'category' }],
    //   options: { filter: 'defined(parent)' },
    //   hidden: ({ document }) => !document?.parentCategory,
    // }),
    defineField({
      title: 'Division',
      name: 'division',
      description: 'What division does this article belong to?',
      type: 'reference',
      to: [{ type: 'division' }],
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
                // @ts-ignore
                divisionId: document?.division?._ref,
              },
            }),
          },
        }),
      ],
      hidden: ({ document }) => !document?.division,
    }),
    defineField({
      title: 'Is this a featured article?',
      description: 'Only select Featured if it has been discussed with everyone on the team.',
      name: 'featuredArticle',
      type: 'boolean',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      description:
        'Set it to the date and time you want to publish the article, usually the day you are writing it.',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'excerpt',
      title: 'Article Excerpt',
      description:
        'This will be used for article snippets in social media and Google searches. Ideally between 110 and 160 characters.',
      type: 'string',
      validation: (rule) => [
        rule.required().error('We need an excerpt before publishing.'),
        rule.min(110).warning('This is a short excerpt. Try to add 10-20 more characters.'),
        rule.max(160).error('The excerpt should be less than 160 characters'),
      ],
      components: {
        input: CustomStringInputWithLimits,
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      validation: (rule) => rule.required(),
      // components: {
      //   input: CustomBlockContentInput,
      // },
    }),
  ],
})
