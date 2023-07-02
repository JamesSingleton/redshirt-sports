import { defineType, defineField } from 'sanity'
import { HomeIcon } from '@sanity/icons'

export default defineType({
  name: 'school',
  title: 'School',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The name of the college or university. i.e. Virginia Military Institute',
    }),
    defineField({
      name: 'abbreviation',
      title: 'Abbreviation',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The abbreviation or shorter version of the college or university. i.e. VMI',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
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
      name: 'conference',
      title: 'Conference',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (rule) => rule.required(),
      description: 'The conference the college or university belongs to',
    }),
  ],
})
