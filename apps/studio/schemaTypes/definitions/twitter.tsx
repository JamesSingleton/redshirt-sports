import React from 'react'
import { defineField, PreviewProps } from 'sanity'
import { Tweet } from 'react-tweet'

const Preview = (props: PreviewProps & { id?: string }) => {
  const tweetId = props.id!

  return <Tweet id={tweetId} />
}

export const twitter = defineField({
  name: 'twitter',
  type: 'object',
  title: 'Twitter Embed',
  fields: [
    {
      name: 'id',
      type: 'string',
      title: 'Twitter tweet ID',
    },
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
