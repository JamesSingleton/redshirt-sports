import { defineType, defineField, defineArrayMember } from 'sanity'

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
        }),
      ],
    }),
  ],
})
