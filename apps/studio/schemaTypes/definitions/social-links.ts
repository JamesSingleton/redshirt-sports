import { defineField } from 'sanity'

export const socialLinks = defineField({
  name: 'socialLinks',
  title: 'Social Media Links',
  description: 'Add links to your social media profiles',
  type: 'object',
  options: {},
  fields: [
    defineField({
      name: 'twitter',
      title: 'Twitter/X URL',
      description: 'Full URL to your Twitter/X profile',
      type: 'string',
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook URL',
      description: 'Full URL to your Facebook page',
      type: 'string',
    }),
    defineField({
      name: 'youtube',
      title: 'YouTube URL',
      description: 'Full URL to your YouTube channel',
      type: 'string',
    }),
  ],
})
