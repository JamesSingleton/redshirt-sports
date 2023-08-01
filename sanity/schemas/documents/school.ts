import { defineType, defineField, defineArrayMember } from 'sanity'
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
      title: 'Division',
      name: 'division',
      description: 'What division is this school in?',
      type: 'reference',
      to: [{ type: 'division' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Conference',
      name: 'conference',
      description: 'What conferences is this school in?',
      type: 'reference',
      to: [{ type: 'conference' }],
      options: {
        filter: ({ document }) => ({
          filter: 'division._ref == $divisionId',
          params: {
            // @ts-ignore
            divisionId: document?.division?._ref,
          },
        }),
      },
      hidden: ({ document }) => !document?.division,
      validation: (rule) => rule.required(),
    }),
  ],
})
