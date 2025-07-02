import React from 'react'
import { Tweet } from 'react-tweet'
import type { PreviewProps } from 'sanity'
import { defineField, defineType } from 'sanity'

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
