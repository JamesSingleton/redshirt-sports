import React from 'react'
import { defineField, defineType, PreviewProps } from 'sanity'
import { Tweet } from 'react-tweet'

const Preview = (props: PreviewProps & { id?: string }) => {
  const tweetId = props.id!

  return <Tweet id={tweetId} />
}

export const twitter = defineType({
  name: 'twitter',
  type: 'object',
  title: 'Twitter Embed',
  fields: [
    defineField({
      name: 'id',
      type: 'string',
      title: 'Twitter tweet ID',
    }),
  ],
  preview: {
    select: {
      id: 'id',
    },
  },
  components: {
    preview: Preview,
  },
})
