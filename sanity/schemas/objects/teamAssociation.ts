import { defineField } from 'sanity'
import { fields } from 'sanity-pills'

import { yearsList } from '../utils'

export default defineField({
  name: 'teamAssociation',
  title: 'Team Association',
  type: 'object',
  fields: fields({
    year: {
      options: {
        list: yearsList(0, 5),
      },
    },
    team: {
      type: 'reference',
      to: [{ type: 'school' }],
    },
  }),
})
