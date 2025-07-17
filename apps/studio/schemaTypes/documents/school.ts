import { defineField, defineType } from 'sanity'

export const school = defineType({
  name: 'school',
  title: 'School',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The name of the college or university. i.e. Virginia Military Institute',
    }),
    defineField({
      name: 'shortName',
      title: 'Short Name',
      type: 'string',
      description: 'The short name of the college or university. i.e. Virginia Tech',
    }),
    defineField({
      name: 'abbreviation',
      title: 'Abbreviation',
      type: 'string',
      description: 'The abbreviation or shorter version of the college or university. i.e. VMI',
    }),
    defineField({
      name: 'nickname',
      title: 'Nickname',
      description: 'The nickname of the college or university. i.e. Keydets',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['blurhash', 'lqip'],
      },
      validation: (rule) => rule.required(),
      description: 'The logo of the college or university',
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'top25VotingEligible',
      title: 'Top 25 Voting Eligible',
      type: 'boolean',
      description: 'Is this school eligible to be voted on in the Top 25?',
      initialValue: true,
    }),
    defineField({
      name: 'conferenceAffiliations',
      title: 'Conference Affiliations',
      type: 'array',
      description: 'What conferences is this school in for each sport?',
      of: [
        {
          type: 'object',
          name: 'conferenceAffiliation',
          title: 'Conference Affiliation',
          fields: [
            defineField({
              name: 'sport',
              title: 'Sport',
              type: 'reference',
              to: [{ type: 'sport' }],
              validation: (rule) => rule.required(),
              options: {
                disableNew: true,
              },
            }),
            defineField({
              name: 'conference',
              title: 'Conference',
              type: 'reference',
              to: [{ type: 'conference' }],
              validation: (rule) => rule.required(),
              options: {
                disableNew: true,
                filter: ({ parent }) => {
                  // Get the selected sport from this affiliation
                  const sportRef =
                    parent && !Array.isArray(parent) && typeof parent === 'object'
                      ? (parent as { sport?: { _ref?: string } }).sport?._ref
                      : undefined

                  if (!sportRef) {
                    // If no sport selected yet, show all conferences
                    return { filter: 'true' }
                  }

                  // Show conferences that sponsor the selected sport
                  return {
                    filter: '$sportId in sports[]._ref',
                    params: {
                      sportId: sportRef,
                    },
                  }
                },
              },
            }),
          ],
          preview: {
            select: {
              sport: 'sport.title',
              conference: 'conference.name',
            },
            prepare: ({ sport, conference }) => ({
              title: `${sport || 'Unknown Sport'} - ${conference || 'Unknown Conference'}`,
            }),
          },
        },
      ],
      validation: (rule) =>
        rule.custom((affiliations: any) => {
          if (!affiliations || affiliations.length === 0) {
            return true // Allow empty array
          }

          // Check for duplicate sport entries (each sport can only have one conference)
          const sports = new Set()

          for (const affiliation of affiliations) {
            if (affiliation.sport?._ref) {
              if (sports.has(affiliation.sport._ref)) {
                return 'Each sport can only have one conference affiliation'
              }
              sports.add(affiliation.sport._ref)
            }
          }

          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
    prepare: ({ title, media }) => ({
      title,
      media,
    }),
  },
})
