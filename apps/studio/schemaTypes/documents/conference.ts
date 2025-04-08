import { defineType, defineField } from 'sanity'

import { TextInputWithLimits } from '../../components/text-input-with-limits'
import { isUnique } from '../../utils/slug'

export const conference = defineType({
  name: 'conference',
  title: 'Conference',
  type: 'document',
  fields: [
    defineField({
      title: 'Name',
      name: 'name',
      type: 'string',
      description: 'The name of the conference.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Short Name',
      name: 'shortName',
      type: 'string',
      description: 'The short name of the conference.',
    }),
    defineField({
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'name',
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
        rule.required().error('We need an excerpt before publishing.'),
        rule.min(110).warning('This is a short excerpt. Try to add 10-20 more characters.'),
        rule.max(160).error('The excerpt should be less than 160 characters'),
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
      description: 'Please provide a logo for the conference.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Just a brief description of the image.',
        }),
      ],
    }),
    defineField({
      title: 'Division',
      name: 'division',
      type: 'reference',
      to: { type: 'division' },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'shortName',
      subtitle: 'name',
      media: 'logo',
    },
    prepare: ({ title, subtitle, media }) => ({
      title: title,
      subtitle: subtitle,
      media,
    }),
  },
})
