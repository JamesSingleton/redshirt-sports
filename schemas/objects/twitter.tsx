import React from 'react'
import { defineField } from 'sanity'
import { TwitterTweetEmbed } from 'react-twitter-embed'

const Preview = (props: { id: any }) => {
  const { id } = props
  return <TwitterTweetEmbed tweetId={id} options={{ conversation: 'none' }} />
}

export default defineField({
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
  // components: {
  //   preview: Preview,
  // },
})
