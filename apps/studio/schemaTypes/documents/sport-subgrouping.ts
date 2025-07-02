import { defineArrayMember, defineField, defineType } from 'sanity'

export const sportSubgrouping = defineType({
  name: 'sportSubgrouping',
  title: 'Sport Subgrouping',
  type: 'document',
  description:
    "A subgrouping of a sport, such as 'Football Bowl Subdivision', 'Football Championship Subdivision', 'Mid-Major', or 'Power 5'.",
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'The full name of the subgrouping (e.g., "Football Bowl Subdivision", "Power 5 Conference").',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortName',
      title: 'Short Name',
      type: 'string',
      description: 'A shorter version of the name (e.g., "FBS", "Power 5").',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'shortName',
      },
    }),
    defineField({
      name: 'applicableSports',
      title: 'Applicable Sports',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: 'sport' }],
          options: {
            disableNew: true,
          },
        }),
      ],
      description:
        'The sports this subgrouping applies to (e.g., select both "Men\'s Basketball" and "Women\'s Basketball" for "Power 5").',
      validation: (rule) =>
        rule.required().min(1).error('At least one applicable sport is required.'),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'applicableSport.title',
    },
    prepare: ({ title, subtitle }) => ({
      title,
      subtitle,
    }),
  },
})
