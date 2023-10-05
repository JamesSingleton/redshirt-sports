import { defineField } from 'sanity'

// this table will be for the FCS Top 25 that shows how each voter voted, it should include:
// - voter name/twitter handle
// - voter affiliation
// - an array of 25 teams
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
            // array of teams they voted for
            {
              name: 'teams',
              title: 'Teams',
              type: 'array',
              of: [
                {
                  type: 'reference',
                  to: [
                    {
                      type: 'school',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
