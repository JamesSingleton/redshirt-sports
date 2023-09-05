import { defineField } from 'sanity'

export default defineField({
  title: 'Social Media',
  name: 'socialMedia',
  type: 'object',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Social Platform',
      validation: (Rule) => Rule.required(),
      initialValue: 'Email',
      options: {
        list: [
          'Email',
          'Twitter',
          'Facebook',
          'Instagram',
          'Website',
          'Spotify Podcast',
          'Apple Podcast',
          'Overcast Podcast',
        ],
      },
    },
    {
      name: 'url',
      type: 'url',
      title: 'URL',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https', 'mailto', 'tel'],
        }),
    },
  ],
})
