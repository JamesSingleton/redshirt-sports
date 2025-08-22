// import React from 'react'
// import type { PreviewProps } from 'sanity'
import { defineField, defineType } from 'sanity'

import TweetPreview from '../../components/tweet'

// const Preview = (props: PreviewProps & { id?: string }) => {
//   const tweetId = props.id!

//   return <Tweet id={tweetId} />
// }

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
      tweetId: 'id',
    },
  },
  components: {
    preview: TweetPreview,
  },
})
