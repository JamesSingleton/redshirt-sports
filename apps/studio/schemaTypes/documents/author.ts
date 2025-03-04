import { defineType, defineField } from 'sanity'
import { UsersIcon } from '@sanity/icons'
import { TextInputWithLimits } from '../../components/text-input-with-limits'

export const author = defineType({
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
      title: 'Roles',
      name: 'roles',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              'Contributor',
              'Correspondent',
              'Editor',
              'Founder',
              'Guest Writer',
              'Historian',
              'Podcast Host',
              'Recruiting Analyst',
              'Senior Writer',
              'Transfer Portal Analyst',
            ],
          },
        },
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['blurhash', 'lqip'],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'biography',
      title: 'Biography',
      description: 'A short biography',
      type: 'text',
      validation: (rule) => rule.max(350).required(),
      components: {
        input: TextInputWithLimits,
      },
    }),
    // defineField({
    //   name: 'collegeOrUniversity',
    //   title: 'College or University',
    //   description: 'The college or university you graduated from.',
    //   type: 'reference',
    //   to: [{ type: 'school' }],
    // }),
    // defineField({
    //   name: 'socialMedia',
    //   title: 'Social Media',
    //   type: 'array',
    //   of: [
    //     {
    //       type: 'socialMedia',
    //     },
    //   ],
    //   validation: (rule) => rule.required(),
    // }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'roles',
      media: 'image',
    },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle?.join(', '),
      media,
    }),
  },
})
