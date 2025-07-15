import { User } from 'lucide-react'
import { defineField, defineType } from 'sanity'

import { TextInputWithLimits } from '../../components/text-input-with-limits'
import { createSlug } from '../../utils/slug'
import { socialLinks } from '../definitions/social-links'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: User,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required().error('Author name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
        slugify: createSlug,
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
      title: 'Bio',
      description: "A short paragraph about the author's background and expertise",
      type: 'text',
      validation: (rule) => rule.required().error('Bio is required'),
      components: {
        input: TextInputWithLimits,
      },
      rows: 3,
    }),
    socialLinks,
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
