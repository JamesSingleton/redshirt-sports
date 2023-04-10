import { defineField } from 'sanity'

export default defineField({
  type: 'object',
  name: 'height',
  title: 'Height',
  fields: [
    {
      type: 'number',
      name: 'feet',
      title: 'Feet',
      options: {
        list: [4, 5, 6, 7],
      },
    },
    {
      type: 'number',
      name: 'inches',
      title: 'Inches',
      validation: (rule) => rule.max(11),
      options: {
        list: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      },
    },
  ],
  options: {
    columns: 2,
  },
})
