import { defineType, defineField, defineArrayMember } from 'sanity'

import { CustomTextInputWithLimits } from '@/sanity/plugins/CustomTextInputWithLimits'

export default defineType({
  name: 'division',
  title: 'Divisions',
  type: 'document',
  // define fields for an individual college football division
  fields: [
    defineField({
      title: 'Name',
      name: 'name',
      type: 'string',
      description: 'The name of the division.',
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
        isUnique: (value, context) => context.defaultIsUnique(value, context),
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
        input: CustomTextInputWithLimits,
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
    defineField({
      title: 'Conferences',
      name: 'conferences',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'conference' }],
          options: {
            filter: ({ document }) => ({
              filter: 'division._ref == $divisionId',
              params: {
                divisionId: document._id.replace('drafts.', ''),
              },
            }),
          },
        }),
      ],
    }),
  ],
})
