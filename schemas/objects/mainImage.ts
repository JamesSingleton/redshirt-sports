import { defineField } from 'sanity'

export default defineField({
  name: 'mainImage',
  type: 'image',
  title: 'Image',
  options: {
    hotspot: true,
    metadata: ['blurhash', 'lqip'],
  },
  fields: [
    {
      name: 'caption',
      type: 'string',
      title: 'Caption',
    },
    {
      name: 'alt',
      type: 'string',
      title: 'Alternative text',
      description: 'Important for SEO and accessibility.',
      validation: (Rule) => Rule.error('You have to fill out the alternative text.').required(),
    },
  ],
  preview: {
    select: {
      imageUrl: 'asset.url',
      title: 'caption',
    },
  },
})
