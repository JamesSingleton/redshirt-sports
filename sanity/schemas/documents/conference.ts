import { defineType, defineField } from 'sanity'
import { CustomTextInputWithLimits } from '@/sanity/plugins/CustomTextInputWithLimits'

export default defineType({
  name: 'conference',
  title: 'Conferences',
  type: 'document',
  // define fields for an individual college football conference
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
})
