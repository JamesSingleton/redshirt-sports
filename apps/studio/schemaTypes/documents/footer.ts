import { defineField, defineType } from 'sanity'
import { LayoutPanelLeft, Link, PanelBottom } from 'lucide-react'

const footerColumnLink = defineField({
  name: 'footerColumnLink',
  type: 'object',
  icon: Link,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      title: 'Name',
      description: 'The name of the link',
    }),
    defineField({
      name: 'url',
      type: 'customUrl',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      externalUrl: 'url.external',
      urlType: 'url.type',
      internalType: 'url.internalType',
      internalDocUrl: 'url.internal.slug.current',
      internalCustomUrl: 'url.internalUrl',
      openInNewTab: 'url.openInNewTab',
    },
    prepare: ({
      title,
      externalUrl,
      urlType,
      internalType,
      internalDocUrl,
      internalCustomUrl,
      openInNewTab,
    }) => {
      let url
      if (urlType === 'external') {
        url = externalUrl
      } else if (internalType === 'reference') {
        url = internalDocUrl
      } else if (internalType === 'custom') {
        url = internalCustomUrl
      }

      const newTabIndicator = openInNewTab ? ' ↗' : ''
      const truncatedUrl = url?.length > 30 ? `${url.substring(0, 30)}...` : url

      return {
        title: title || 'Untitled Link',
        subtitle: `${urlType === 'external' ? 'External' : 'Internal'} • ${truncatedUrl}${newTabIndicator}`,
        media: Link,
      }
    },
  },
})

const footerColumn = defineField({
  name: 'footerColumn',
  type: 'object',
  icon: LayoutPanelLeft,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'Title for the column',
    }),
    defineField({
      name: 'links',
      type: 'array',
      title: 'Links',
      description: 'Links for the column',
      of: [footerColumnLink],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      links: 'links',
    },
    prepare({ title, links = [] }) {
      return {
        title: title || 'Untitled Column',
        subtitle: `${links.length} link${links.length === 1 ? '' : 's'}`,
      }
    },
  },
})

export const footer = defineType({
  name: 'footer',
  type: 'document',
  title: 'Footer',
  description: 'Footer content for your website',
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      initialValue: 'Footer',
      title: 'Label',
      description: 'Label used to identify footer in the CMS',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      type: 'text',
      rows: 2,
      title: 'Subtitle',
      description: 'Subtitle that sits beneath the logo in the footer',
    }),
    defineField({
      name: 'columns',
      type: 'array',
      title: 'Columns',
      description: 'Columns for the footer',
      of: [footerColumn],
    }),
  ],
  preview: {
    select: {
      title: 'label',
    },
    prepare: ({ title }) => ({
      title: title || 'Untitled Footer',
      media: PanelBottom,
    }),
  },
})
