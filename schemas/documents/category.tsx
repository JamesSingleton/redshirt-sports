import { defineType, defineField } from 'sanity'
import { TagIcon } from '@sanity/icons'
import CustomStringInputWithLimits from '../../plugins/CustomStringInputWithLimits'

export default defineType({
  name: 'category',
  title: 'Category',
  icon: TagIcon,
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'pageHeader',
      title: 'Page Header',
      type: 'string',
      description: 'The header displayed on the page for the category',
    }),
    defineField({
      name: 'subTitle',
      title: 'Sub Title',
      type: 'string',
      description: 'The sub title displayed on the page for the category',
    }),
    defineField({
      name: 'parent',
      title: 'Parent',
      type: 'reference',
      to: [{ type: 'category' }],
      options: {
        filter: '!defined(parent)',
      },
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'Press generate to generate the slug automatically, do not manually input slug',
      type: 'slug',
      readOnly: ({ document }) => !!document?.title && !!document?.slug,
      options: {
        source: 'title',
        slugify: (input) =>
          input
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, ''),
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description:
        'This will be used for article snippets in social media and Google searches. Ideally between 110 and 160 characters.',
      type: 'string',
      validation: (rule) => [
        rule.required().error('We need an excerpt before publishing.'),
        rule.min(110).warning('This is a short excerpt. Try to add 10-20 more characters.'),
        rule.max(160).error('The excerpt should be less than 160 characters'),
      ],
      components: {
        input: CustomStringInputWithLimits,
      },
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['blurhash', 'lqip'],
      },
      description: 'The logo of the conference',
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          description: 'Important for SEO and accessibility.',
          validation: (rule) => rule.error('You have to fill out the alternative text.').required(),
        },
      ],
    }),
  ],
})
