import { getTweet, Tweet } from 'react-tweet/api'

export async function getTweetData(id: string): Promise<Tweet | null> {
  try {
    const tweet = await getTweet(id)

    if (!tweet || Object.keys(tweet).length === 0) {
      throw new Error('Tweet not found')
    }

    return tweet
  } catch (error) {
    console.log(error)
    return null
  }
}
