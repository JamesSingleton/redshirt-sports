import { defineField } from 'sanity'

export default defineField({
  title: 'Class Year',
  name: 'classYear',
  type: 'string',
  description: 'The class year of the player',
  options: {
    list: [
      {
        value: 'FR',
        title: 'Freshman',
      },
      {
        value: 'RS-FR',
        title: 'Redshirt Freshman',
      },
      {
        value: 'SO',
        title: 'Sophomore',
      },
      {
        value: 'RS-SO',
        title: 'Redshirt Sophomore',
      },
      {
        value: 'JR',
        title: 'Junior',
      },
      {
        value: 'RS-JR',
        title: 'Redshirt Junior',
      },
      {
        value: 'SR',
        title: 'Senior',
      },
      {
        value: 'RS-SR',
        title: 'Redshirt Senior',
      },
    ],
  },
})
