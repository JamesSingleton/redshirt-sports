import { defineType, defineField } from 'sanity'
import { createSlug, isUnique } from '../../utils/slug'
import { PathnameFieldComponent } from '../../components/slug-field-component'
import { ogFields } from '../../utils/og-fields'
import { seoFields } from '../../utils/seo-fields'
import { GROUPS, GROUP } from '../../utils/constant'

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
        // slugify: createSlug,
        isUnique,
      },
      validation: (rule) => rule.required(),
    }),
    ...seoFields,
    ...ogFields,
  ],
})
