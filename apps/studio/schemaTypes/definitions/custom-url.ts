import { defineField, defineType } from 'sanity'

import { createRadioListLayout, isValidUrl } from '../../utils/helper'

const allLinkableTypes = [
  { type: 'post' },
  { type: 'division' },
  { type: 'conference' },
  { type: 'legal' },
]

export const customUrl = defineType({
  name: 'customUrl',
  type: 'object',
  fields: [
    defineField({
      name: 'type',
      type: 'string',
      options: createRadioListLayout(['internal', 'external']),
      initialValue: () => 'external',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      description: 'If checked, the link will open in a new tab.',
      initialValue: () => false,
    }),
    defineField({
      name: 'external',
      type: 'string',
      title: 'URL',
      hidden: ({ parent }) => parent?.type !== 'external',
      validation: (Rule) => [
        Rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type
          if (type === 'external') {
            if (!value) return "Url can't be empty"
            const isValid = isValidUrl(value)
            if (!isValid) return 'Invalid URL'
          }
          return true
        }),
      ],
    }),
    defineField({
      name: 'href',
      type: 'string',
      initialValue: () => '#',
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'internalType',
      type: 'string',
      title: 'Internal Link Type',
      hidden: ({ parent }) => parent?.type !== 'internal',
      options: {
        list: [
          { title: 'Document Reference', value: 'reference' },
          { title: 'Custom URL', value: 'custom' },
        ],
        layout: 'radio',
      },
      initialValue: 'reference',
    }),
    defineField({
      name: 'internal',
      type: 'reference',
      title: 'Document Reference',
      options: { disableNew: true },
      hidden: ({ parent }) => parent?.type !== 'internal' || parent?.internalType !== 'reference',
      to: allLinkableTypes,
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type
          const internalType = (parent as { internalType?: string })?.internalType
          if (type === 'internal' && internalType === 'reference' && !value?._ref)
            return "Document reference can't be empty"
          return true
        }),
      ],
    }),
    defineField({
      name: 'internalUrl',
      type: 'string',
      title: 'Custom URL',
      description: 'Enter a relative URL (e.g., /about, /blog/post-1)',
      hidden: ({ parent }) => parent?.type !== 'internal' || parent?.internalType !== 'custom',
      validation: (rule) => [
        rule.custom((value, { parent }) => {
          const type = (parent as { type?: string })?.type
          const internalType = (parent as { internalType?: string })?.internalType
          if (type === 'internal' && internalType === 'custom') {
            if (!value) return "URL can't be empty"
            if (!value.startsWith('/')) return 'Internal URL must start with /'
          }
          return true
        }),
      ],
    }),
  ],
  preview: {
    select: {
      externalUrl: 'external',
      urlType: 'type',
      internalType: 'internalType',
      internalDocUrl: 'internal.slug.current',
      internalCustomUrl: 'internalUrl',
      openInNewTab: 'openInNewTab',
    },
    prepare({
      externalUrl,
      urlType,
      internalType,
      internalDocUrl,
      internalCustomUrl,
      openInNewTab,
    }) {
      let url = ''

      if (urlType === 'external') {
        url = externalUrl
      } else if (internalType === 'reference') {
        url = `/${internalDocUrl}`
      } else {
        url = internalCustomUrl
      }

      const newTabIndicator = openInNewTab ? ' ↗' : ''
      const truncatedUrl = url?.length > 30 ? `${url.substring(0, 30)}...` : url

      return {
        title: `${urlType === 'external' ? 'External' : 'Internal'} Link`,
        subtitle: `${truncatedUrl}${newTabIndicator}`,
      }
    },
  },
})
