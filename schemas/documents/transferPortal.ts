import { defineType, defineField } from 'sanity'

import { yearsList } from '@schemas/utils'

export default defineType({
  name: 'transferPortal',
  title: 'Transfer Portal',
  type: 'document',
  fields: [
    defineField({
      name: 'player',
      title: 'Player',
      type: 'reference',
      to: [{ type: 'player' }],
      description: 'The player that is in the transfer portal',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Transfer Status',
      name: 'transferStatus',
      type: 'string',
      description: 'Is the player entered into the transfer portal, committed or withdrawn?',
      options: {
        list: ['Entered', 'Committed', 'Withdrawn'],
      },
      initialValue: 'Entered',
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: 'Year',
      name: 'year',
      type: 'string',
      description: 'The year the player entered the transfer portal',
      options: {
        list: yearsList(5, 1),
      },
    }),
    defineField({
      name: 'transferringFrom',
      title: 'Transferring From',
      type: 'reference',
      to: [{ type: 'school' }],
      description: 'The school the player is transferring from',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'transferringTo',
      title: 'Transferring To',
      type: 'reference',
      to: [{ type: 'school' }],
      description: 'The school the player is transferring to',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'player.name',
      playerPosition: 'player.position',
      imageUrl: 'player.image.asset.url',
      fromSchool: 'transferringFrom.name',
      toSchool: 'transferringTo.name',
    },
    prepare({ title, playerPosition, imageUrl, fromSchool, toSchool }) {
      return {
        title: `${title} (${playerPosition})`,
        imageUrl,
        subtitle: `Transferring from ${fromSchool} to ${toSchool}`,
      }
    },
  },
})
