import { Suspense } from 'react'
import { Tweet, getTweet } from 'react-tweet/api'
import { EmbeddedTweet, TweetNotFound, TweetSkeleton, type TweetProps } from 'react-tweet'

import redis from '@lib/redis'

interface TweetArgs {
  id: string
}

async function getAndCacheTweet(id: string): Promise<Tweet | undefined> {
  try {
    const tweet = await getTweet(id)
    // if tweet is null or tweet is an empty object
    if (!tweet || Object.keys(tweet).length === 0) {
      throw new Error('Tweet not found')
    }
    // cache the tweet
    await redis.set(`tweet:${id}`, JSON.stringify(tweet))
    return tweet
  } catch (error) {
    // check if the tweet is cached
    const cachedTweet = (await redis.get(`tweet:${id}`)) as Tweet | undefined
    return cachedTweet
  }
}

const TweetContent = async ({ id, components, onError }: TweetProps) => {
  let error

  const tweet = id
    ? await getAndCacheTweet(id).catch((err) => {
        if (onError) {
          error = onError(err)
        } else {
          console.error(err)
          error = err
        }
      })
    : undefined

  if (!tweet) {
    const NotFound = components?.TweetNotFound || TweetNotFound
    return <NotFound error={error} />
  }

  return <EmbeddedTweet tweet={tweet} components={components} />
}

export const ReactTweet = (props: TweetProps) => (
  <Suspense fallback={<TweetSkeleton />}>
    <TweetContent {...props} />
  </Suspense>
)

export async function Tweet({ id }: TweetArgs) {
  return (
    <div className="tweet my-6">
      <div className={`flex justify-center`}>
        <ReactTweet id={id} />
      </div>
    </div>
  )
}
