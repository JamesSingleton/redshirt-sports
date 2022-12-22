import { previewData } from 'next/headers'

import { getAllPostsSlugs, getSettings, getPostAndMoreStories } from '@lib/sanity.client'
import PostPage from '@components/post/PostPage'
import { getTweets } from '@lib/twitter'

export async function generateStaticParams() {
  return await getAllPostsSlugs()
}

export default async function SlugRoute({ params }: { params: { slug: string } }) {
  const settings = getSettings()

  if (previewData()) {
    const token = previewData().token || null
    const data = getPostAndMoreStories(params.slug, token)

    return (
      <>
        <h1>Hurray</h1>
      </>
    )
  }

  const { post, morePosts } = await getPostAndMoreStories(params.slug)
  const enriched = []

  for (const block of post.body) {
    if (block._type === 'twitter') {
      const tweetData = await getTweets(block.id)
      enriched.push({
        ...block,
        metadata: tweetData,
      })
      continue
    }
    enriched.push(block)
  }

  post.body = enriched

  return <PostPage post={post} morePosts={morePosts} settings={await settings} />
}
