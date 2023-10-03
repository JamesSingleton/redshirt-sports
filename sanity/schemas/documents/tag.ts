import { defineType, defineField } from 'sanity'
import { TagIcon } from 'lucide-react'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  icon: TagIcon,
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
      readOnly: ({ document }) => !!document?.name && !!document?.slug,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A brief description of the tag.',
      validation: (rule) => rule.required(),
    }),
  ],
})
