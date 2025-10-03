import { TwitterIcon } from '@sanity/icons'
import React from 'react'
import { type PreviewProps } from 'sanity'

export default function TweetPreview(props: PreviewProps) {
  if (!props?.title) return <div>No Tweet ID</div>
  const tweetUrl = `https://x.com/i/status/${props?.title}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <TwitterIcon />
      <div>
        <a href={tweetUrl} target="_blank" rel="noopener noreferrer">
          {tweetUrl}
        </a>
      </div>
    </div>
  )
}
