import { defineField } from 'sanity'

export default defineField({
  title: 'Top 25 Table',
  name: 'top25Table',
  type: 'object',
  fields: [
    {
      name: 'votes',
      title: 'Votes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'voterName',
              title: 'Voter Name',
              type: 'string',
            },
            {
              name: 'voterAffiliation',
              title: 'Voter Affiliation',
              type: 'string',
            },
            {
              name: 'teams',
              title: 'Teams',
              type: 'array',
              of: [
                {
                  type: 'reference',
                  to: [{ type: 'school' }],
                },
              ],
            },
          ],
          preview: {
            select: {
              title: 'voterName',
              subtitle: 'voterAffiliation',
            },
            prepare({ title, subtitle }) {
              return {
                title,
                subtitle,
              }
            },
          },
        },
      ],
    },
  ],
  preview: {
    select: {
      votes: 'votes',
    },
    prepare({ votes }) {
      return {
        title: `FCS Top 25 Table`,
        subtitle: `${votes.length} voters`,
      }
    },
  },
})
