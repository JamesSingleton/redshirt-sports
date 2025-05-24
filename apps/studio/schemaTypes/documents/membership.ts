import { defineType, defineField } from 'sanity'

export const membership = defineType({
  name: 'membership',
  title: 'Membership',
  type: 'document',
  description: 'Membership info for a school + conference + sport combination',
  fields: [
    defineField({
      name: 'school',
      title: 'School',
      type: 'reference',
      to: [{ type: 'school' }],
      validation: (rule) => rule.required(),
      description: 'The school that is a member of the conference for this sport.',
    }),
    defineField({
      name: 'conference',
      title: 'Conference',
      type: 'reference',
      to: [{ type: 'conference' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sport',
      title: 'Sport',
      type: 'reference',
      to: [{ type: 'sport' }],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'school.shortName',
      conference: 'conference.shortName',
      media: 'school.image',
      sport: 'sport.title',
    },
    prepare: ({ title, conference, media, sport }) => ({
      title: `${title} (${sport})`,
      subtitle: conference,
      media,
    }),
  },
})
