import { defineType, defineField, defineArrayMember } from 'sanity'

import { TextInputWithLimits } from '../../components/text-input-with-limits'
import { isUnique } from '../../utils/slug'

export const division = defineType({
  name: 'division',
  title: 'Division',
  type: 'document',
  fields: [
    defineField({
      title: 'Name',
      name: 'name',
      type: 'string',
      description: 'The name of the division.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Title',
      name: 'title',
      type: 'string',
      description: 'The title of the division.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Heading',
      name: 'heading',
      type: 'string',
      description: 'The heading displayed on the page for the division.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Long Name',
      name: 'longName',
      type: 'string',
      description:
        'The long name of the division. For example, "Football Championship Subdivision".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input) =>
          input
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, ''),
        isUnique,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Description',
      name: 'description',
      type: 'text',
      description:
        'This will be used for article snippets in social media and Google searches. Ideally between 110 and 160 characters.',
      components: {
        input: TextInputWithLimits,
      },
      validation: (rule) => [
        rule
          .min(140)
          .warning(
            'The meta description should be at least 140 characters for optimal SEO visibility in search results',
          ),
        rule
          .max(160)
          .warning(
            'The meta description should not exceed 160 characters as it will be truncated in search results',
          ),
      ],
    }),
    defineField({
      title: 'Logo',
      name: 'logo',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['blurhash', 'lqip'],
      },
      description: 'Please provide a logo for the division.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Just a brief description of the image.',
          validation: (rule) => rule.error('You have to fill out the alt text.').required(),
        }),
      ],
    }),
    // defineField({
    //   title: 'Conferences',
    //   name: 'conferences',
    //   type: 'array',
    //   of: [
    //     defineArrayMember({
    //       type: 'reference',
    //       to: [{ type: 'conference' }],
    //       options: {
    //         filter: ({ document }) => ({
    //           filter: 'division._ref == $divisionId',
    //           params: {
    //             divisionId: document._id.replace('drafts.', ''),
    //           },
    //         }),
    //       },
    //     }),
    //   ],
    // }),
  ],
})
