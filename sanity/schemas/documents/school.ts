import { defineType, defineField, defineArrayMember } from 'sanity'
import { HomeIcon } from '@sanity/icons'

export default defineType({
  name: 'school',
  title: 'School',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
      description: 'The name of the college or university. i.e. Virginia Military Institute',
    }),
    defineField({
      name: 'shortName',
      title: 'Short Name',
      type: 'string',
      description: 'The short name of the college or university. i.e. Virginia Tech',
    }),
    defineField({
      name: 'abbreviation',
      title: 'Abbreviation',
      type: 'string',
      description: 'The abbreviation or shorter version of the college or university. i.e. VMI',
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
      description: 'The logo of the college or university',
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'top25VotingEligible',
      title: 'Top 25 Voting Eligible',
      type: 'boolean',
      description: 'Is this school eligible to be voted on in the Top 25?',
      initialValue: true,
    }),
    defineField({
      title: 'Division',
      name: 'division',
      description: 'What division is this school in?',
      type: 'reference',
      to: [{ type: 'division' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Conference',
      name: 'conference',
      description: 'What conferences is this school in?',
      type: 'reference',
      to: [{ type: 'conference' }],
      options: {
        filter: ({ document }) => ({
          filter: 'division._ref == $divisionId',
          params: {
            // @ts-ignore
            divisionId: document?.division?._ref,
          },
        }),
      },
      hidden: ({ document }) => !document?.division,
      validation: (rule) => rule.required(),
    }),
  ],
})
