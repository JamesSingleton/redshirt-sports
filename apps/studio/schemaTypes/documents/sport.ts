import { defineType, defineField } from 'sanity'
import { isUnique } from '../../utils/slug'
import { GROUPS } from '../../utils/constant'

export const sport = defineType({
  name: 'sport',
  title: 'Sport',
  type: 'document',
  groups: GROUPS,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',

      options: {
        source: 'title',
        isUnique,
      },
      validation: (rule) => rule.required(),
    }),
  ],
})
