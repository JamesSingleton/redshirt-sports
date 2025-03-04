import { defineType, defineField } from 'sanity'

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  description: 'Redirect for next.config.js',
  fields: [
    defineField({
      name: 'source',
      type: 'string',
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => {
          if (!value) return "Can't be blank"
          if (!value.startsWith('/')) {
            return 'The path must start with a /'
          }
          return true
        }),
      ],
    }),
    defineField({
      name: 'destination',
      type: 'string',
      validation: (rule) => [
        rule.required(),
        rule.custom((value) => {
          if (!value) return "Can't be blank"
          if (!value.startsWith('/')) {
            return 'The path must start with a /'
          }
          return true
        }),
      ],
    }),
    defineField({
      name: 'permanent',
      type: 'boolean',
    }),
  ],
  // null / false makes it temporary (307)
  initialValue: {
    permanent: true,
  },
  preview: {
    select: {
      title: 'source',
      subtitle: 'destination',
    },
  },
})
