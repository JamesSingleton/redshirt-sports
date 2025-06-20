import { CogIcon } from 'lucide-react'
import { defineField, defineType } from 'sanity'

import { socialLinks } from '../definitions/social-links'

export const settings = defineType({
  name: 'settings',
  type: 'document',
  title: 'Settings',
  description: 'Global settings and configuration for your website',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      initialValue: 'Settings',
      title: 'Label',
      description: 'Label used to identify settings in the CMS',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'siteTitle',
      type: 'string',
      title: 'Site Title',
      description: 'The main title of your website, used in browser tabs and SEO',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'siteDescription',
      type: 'text',
      title: 'Site Description',
      description: 'A brief description of your website for SEO purposes',
      validation: (rule) => rule.required().min(140).max(160),
    }),
    defineField({
      name: 'logo',
      type: 'image',
      title: 'Site Logo',
      description: 'Upload your website logo',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'defaultOpenGraphImage',
      type: 'image',
      title: 'Default Open Graph Image',
      description: 'Image used for social media sharing when no specific image is set',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'contactEmail',
      type: 'string',
      title: 'Contact Email',
      description: 'Primary contact email address for your website',
      validation: (rule) => rule.email(),
    }),
    socialLinks,
  ],
  preview: {
    select: {
      title: 'label',
    },
    prepare: ({ title }) => ({
      title: title || 'Untitled Settings',
      media: CogIcon,
    }),
  },
})
