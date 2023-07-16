import { defineType, defineField } from 'sanity'

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
