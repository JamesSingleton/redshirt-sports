import states from '@schemas/states'
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'player',
  title: 'Player',
  type: 'document',
  fields: [
    defineField({
      title: 'Players Name',
      name: 'name',
      type: 'string',
      description: "The player's name",
      validation: (rule) => rule.required(),
    }),
    defineField({
      title: "Player's Image",
      name: 'image',
      type: 'image',
      description: "The player's headshot, you usually can get this from their school's website.",
    }),
    defineField({
      title: "Player's Position",
      name: 'position',
      type: 'position',
      validation: (rule) => rule.required(),
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
      name: 'highSchool',
      title: 'High School',
      type: 'string',
    }),
    defineField({
      name: 'homeTown',
      title: 'Home Town',
      type: 'object',
      fields: [
        defineField({
          name: 'city',
          title: 'City',
          type: 'string',
        }),
        defineField({
          name: 'state',
          title: 'State',
          type: 'string',
          options: {
            list: [...states],
          },
        }),
      ],
    }),
    defineField({
      name: 'commitment',
      title: 'Commitment',
      type: 'object',
      fields: [
        defineField({
          name: 'school',
          title: 'School',
          description: 'The school the player has committed to',
          type: 'reference',
          to: [{ type: 'school' }],
        }),
        defineField({
          name: 'date',
          title: 'Commitment Date',
          description: 'The date the player committed to the school',
          type: 'date',
        }),
      ],
    }),
  ],
})
