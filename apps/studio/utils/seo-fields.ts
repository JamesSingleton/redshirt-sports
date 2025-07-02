import { defineField } from 'sanity'

import { GROUP } from './constant'

export const seoFields = [
  defineField({
    name: 'seoTitle',
    title: 'SEO meta title override',
    description: 'This will override the meta title. If left blank it will inherit the page title.',
    type: 'string',
    validation: (rule) => rule.warning('A page title is required'),
    group: GROUP.SEO,
  }),
  defineField({
    name: 'seoDescription',
    title: 'SEO meta description override',
    description:
      'This will override the meta description. If left blank it will inherit the description from the page description.',
    type: 'text',
    rows: 2,
    validation: (rule) => [
      rule.warning('A description is required'),
      rule.max(160).warning('No more than 160 characters'),
    ],
    group: GROUP.SEO,
  }),
  defineField({
    name: 'seoImage',
    title: 'SEO image override',
    description:
      'This will override the main image. If left blank it will inherit the image from the main image.',
    type: 'image',
    group: GROUP.SEO,
    options: {
      hotspot: true,
    },
  }),
]
