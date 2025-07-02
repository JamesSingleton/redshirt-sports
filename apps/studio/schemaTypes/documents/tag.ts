import { defineField, defineType } from 'sanity'

import { createSlug, isUnique } from '../../utils/slug'

export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Press generate to generate the slug automatically, do not manually input slug.',
      options: {
        source: 'name',
        slugify: createSlug,
        isUnique,
      },
      readOnly: ({ document }) => !!document?.name && !!document?.slug,
      validation: (rule) => rule.required(),
    }),
  ],
})
