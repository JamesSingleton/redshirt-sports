import { Suspense } from 'react'
import { Tweet, getTweet } from 'react-tweet/api'
import { EmbeddedTweet, TweetNotFound, TweetSkeleton, type TweetProps } from 'react-tweet'

import redis from '@/utils/redis'

async function getAndCacheTweet(id: string): Promise<Tweet | undefined> {
  try {
    console.log('Fetching tweet', id)
    const tweet = await getTweet(id)
    console.log('Before Redis Set', tweet)

    // @ts-ignore tombstone is available I don't know why it's not in the types
    if (tweet && !tweet.tombstone) {
      await redis.set(`tweet:${id}`, tweet)
      console.log('After Redis Set', tweet)
      return tweet
    }
  } catch (error) {
    console.log('Error fetching tweet', error)
  }

  const cachedTweet: Tweet | null = await redis.get(`tweet:${id}`)
  console.log('cachedTweet', cachedTweet)

  // @ts-ignore tombstone is available I don't know why it's not in the types
  if (!cachedTweet || cachedTweet.tombstone) return undefined

  console.log('tweet cache hit', id)
  return cachedTweet
}

const TweetContent = async ({ id, components }: TweetProps) => {
  console.log('BEFORE getAndCacheTweet', id)
  const tweet = id ? await getAndCacheTweet(id) : undefined
  console.log('tweet from Tweet Component', tweet)

  if (!tweet) return <TweetNotFound />

  return <EmbeddedTweet tweet={tweet} components={components} />
}

export const ReactTweet = (props: TweetProps) => (
  <Suspense fallback={<TweetSkeleton />}>
    <TweetContent {...props} />
  </Suspense>
)

export async function CachedTweet({ id }: { id: string }) {
  console.log('Before Rendering ReactTweet', id)
  return <ReactTweet id={id} />
}
