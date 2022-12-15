import { previewData } from 'next/headers'

import { getAllPostsSlugs, getSettings, getPostAndMoreStories } from '@lib/sanity.client'
import PostPage from '@components/post/PostPage'

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

  const data = getPostAndMoreStories(params.slug)

  return <PostPage data={await data} settings={await settings} />
}
