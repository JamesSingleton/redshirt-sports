import { defineType, defineField } from 'sanity'

export const yearsList = (future: number, past: number) => {
  const currentYear = new Date().getFullYear() + future
  const years = []

  for (var i = 0; i < future + past; i++) {
    years.push((currentYear - i).toString())
  }

  return years.reverse()
}

export default defineType({
  title: 'Player',
  name: 'player',
  type: 'document',
  fields: [
    defineField({
      title: 'Players Name',
      name: 'name',
      type: 'string',
      description: 'Name of the player',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Player's Image",
      name: 'image',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['blurhash', 'lqip'],
      },
      description: "The player's headshot, you usually can get this from their school's website.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Players Twitter',
      name: 'twitter',
      type: 'string',
      description: 'The players twitter handle',
    }),
    defineField({
      title: "Player's Height",
      name: 'height',
      type: 'height',
      description: 'The players height in feet and inches',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Player's Weight",
      name: 'weight',
      type: 'number',
      description: "The players weight in pounds (250), you don't need to add the lbs",
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Class Year',
      name: 'classYear',
      type: 'string',
      description: 'Their recruiting class year',
      options: {
        list: yearsList(5, 5),
      },
    }),
    defineField({
      title: 'Class',
      name: 'class',
      type: 'string',
      description: 'Their class, aka Freshman, Sophomore, etc.',
      options: {
        list: [
          {
            title: 'Freshman',
            value: 'FR',
          },
          {
            title: 'Redshirt Freshman',
            value: 'RS-FR',
          },
          {
            title: 'Sophomore',
            value: 'SO',
          },
          {
            title: 'Redshirt Sophomore',
            value: 'RS-SO',
          },
          {
            title: 'Junior',
            value: 'JR',
          },
          {
            title: 'Redshirt Junior',
            value: 'RS-JR',
          },
          {
            title: 'Senior',
            value: 'SR',
          },
          {
            title: 'Redshirt Senior',
            value: 'RS-SR',
          },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Player's Position",
      name: 'position',
      type: 'position',
    }),
    defineField({
      title: 'Current School',
      name: 'currentSchool',
      type: 'reference',
      to: [{ type: 'school' }],
      description: 'The school the player is currently attending',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Scools Played For',
      name: 'schoolsPlayedFor',
      type: 'array',
      of: [
        {
          type: 'teamAssociation',
        },
      ],
    }),
    defineField({
      title: 'In Transfer Portal?',
      name: 'inTransferPortal',
      type: 'boolean',
      description: 'Is the player in the transfer portal?',
      initialValue: false,
    }),
    defineField({
      title: 'When did they enter the transfer portal?',
      name: 'transferPortalDate',
      type: 'date',
      description: 'When did the player enter the transfer portal?',
      hidden: ({ parent }) => !parent.inTransferPortal,
    }),
    defineField({
      title: 'Transfer Status',
      name: 'transferStatus',
      type: 'string',
      description: 'The status of the player in the transfer portal',
      options: {
        list: [
          {
            title: 'Entered',
            value: 'entered',
          },
          {
            title: 'Committed',
            value: 'committed',
          },
          {
            title: 'Withdrawn',
            value: 'withdrawn',
          },
        ],
      },
      initialValue: 'entered',
      hidden: ({ parent }) => !parent.inTransferPortal,
    }),
    defineField({
      title: 'Transfer Portal School',
      name: 'transferPortalSchool',
      type: 'reference',
      to: [{ type: 'school' }],
      description: 'The school the player is transferring to',
      validation: (rule) =>
        rule.custom((transferPortalSchool, context) => {
          if (
            context.document?.inTransferPortal &&
            !transferPortalSchool &&
            context.document?.transferStatus === 'committed'
          ) {
            return 'You must select a school if the player is in the transfer portal'
          }
          return true
        }),
      hidden: ({ parent }) => !parent.inTransferPortal,
    }),
    defineField({
      title: 'Offers',
      name: 'offers',
      type: 'array',
      description: 'The schools that have offered the player',
      of: [{ type: 'reference', to: [{ type: 'school' }] }],
      hidden: ({ parent }) => !parent.inTransferPortal,
    }),
  ],
})
