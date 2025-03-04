import { defineField, defineType, defineArrayMember } from 'sanity'
import { ImageIcon, LinkIcon, TwitterIcon } from '@sanity/icons'

const richTextMembers = [
  defineArrayMember({
    name: 'block',
    type: 'block',
    marks: {
      annotations: [],
    },
  }),
  defineArrayMember({
    name: 'image',
    title: 'Image',
    type: 'image',
    icon: ImageIcon,
    options: {
      hotspot: true,
      metadata: ['blurhash', 'lqip'],
    },
    fields: [
      {
        name: 'caption',
        type: 'string',
        title: 'Caption',
        description:
          'Just a brief description of the image as this will be used for alt text for accessibility.',
        validation: (rule) => rule.required(),
      },
      {
        name: 'attribution',
        type: 'string',
        title: 'Attribution',
        description: 'Where did the photo come from?',
        validation: (rule) => rule.required(),
      },
    ],
  }),
  defineArrayMember({
    type: 'twitter',
    icon: TwitterIcon,
  }),
  defineArrayMember({
    name: 'table',
    title: 'Table',
    type: 'table',
  }),
]

export const blockContent = defineType({
  name: 'blockContent',
  type: 'array',
  of: richTextMembers,
})
