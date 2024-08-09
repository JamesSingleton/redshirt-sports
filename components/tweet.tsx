import { Suspense } from 'react'
import { TweetSkeleton, EmbeddedTweet, TweetNotFound } from 'react-tweet'
import { fetchTweet, Tweet } from 'react-tweet/api'
import redis from '@/utils/redis'

async function getAndCacheTweet(id: string): Promise<Tweet | undefined> {
  try {
    const { data, tombstone, notFound } = await fetchTweet(id)

    if (data) {
      await redis.set(`tweet:${id}`, data)
      return data
    } else if (tombstone || notFound) {
      await redis.del(`tweet:${id}`)
    }
  } catch (error) {
    console.error('fetching the tweet failed with:', error)
  }
}

const TweetContent = async ({ id }: { id: string }) => {
  try {
    const tweet = await getAndCacheTweet(id)
    return tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />
  } catch (error) {
    console.log(error)
    return <TweetNotFound error={error} />
  }
}

export const ReactTweet = ({ id }: { id: string }) => {
  return (
    <Suspense fallback={<TweetSkeleton />}>
      <TweetContent id={id} />
    </Suspense>
  )
}
