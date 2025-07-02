import { defineArrayMember, defineField, defineType } from 'sanity'

export const top25Table = defineType({
  title: 'Top 25 Table',
  name: 'top25Table',
  type: 'object',
  fields: [
    defineField({
      name: 'votes',
      title: 'Votes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'voterName',
              title: 'Voter Name',
              type: 'string',
            }),
            defineField({
              name: 'voterAffiliation',
              title: 'Voter Affiliation',
              type: 'string',
            }),
            defineField({
              name: 'teams',
              title: 'Teams',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'reference',
                  to: [{ type: 'school' }],
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'voterName',
              subtitle: 'voterAffiliation',
            },
            prepare: ({ title, subtitle }) => ({
              title,
              subtitle,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      votes: 'votes',
    },
    prepare: ({ votes }) => ({
      title: `FCS Top 25 Table`,
      subtitle: `${votes.length} voters`,
    }),
  },
})
