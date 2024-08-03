import { defineType, defineField } from 'sanity'
import { UsersIcon } from '@sanity/icons'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      type: 'boolean',
      description: 'This will hide the author from the site',
      initialValue: false,
    }),
    defineField({
      title: 'Role',
      name: 'role',
      type: 'string',
      options: {
        list: ['Staff Writer', 'Freelancer', 'Contributor', 'Content Writer', 'Guest Writer'],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Roles',
      name: 'roles',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              'Contributor',
              'Editor',
              'Founder',
              'Guest Writer',
              'Historian',
              'Podcast Host',
              'Recruiting Insider',
              'Senior Writer',
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [
        {
          title: 'Block',
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'External Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                  {
                    title: 'Open in new tab',
                    name: 'blank',
                    type: 'boolean',
                    initialValue: true,
                  },
                ],
              },
            ],
          },
        },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'socialMedia',
      title: 'Social Media',
      type: 'array',
      of: [
        {
          type: 'socialMedia',
        },
      ],
      validation: (rule) => rule.required(),
    }),
  ],
})
