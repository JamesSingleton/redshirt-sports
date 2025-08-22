import { TwitterIcon } from '@sanity/icons'
import React from 'react'

export default function TweetPreview({ tweetId }: { tweetId: string }) {
  if (!tweetId) return <div>No Tweet ID</div>
  const tweetUrl = `https://x.com/i/status/${tweetId}`
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
