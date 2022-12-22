import { notFound } from 'next/navigation'

import { PortableTextComponent } from '@lib/sanity.text'
import Layout from './PostLayout'
import PostHeader from './PostHeader'

import type { Post, Settings } from '@types'
import VerticalArticleCard from '@components/ui/VerticalArticleCard'
import PostFooter from './PostFooter'

export default function PostPage(props: {
  preview?: boolean
  loading?: boolean
  data: { post: Post; morePosts: Post[] }
  settings: Settings
}) {
  const { preview, loading, data, settings } = props
  const { post = {} as any, morePosts = [] } = data || {}
  const slug = post?.slug

  if (!slug && !preview) {
    return notFound()
  }

  return (
    <Layout preview={preview!} loading={loading}>
      <article className="bg-slate-50 pb-12 sm:pb-16 lg:pb-24">
        <PostHeader post={post} />
        <div className="px-5 lg:px-0">
          <div className="prose-md prose m-auto w-11/12 prose-a:text-blue-600 hover:prose-a:text-blue-500 sm:w-3/4 sm:prose-lg">
            <PortableTextComponent value={post.body} />
          </div>
          <PostFooter author={post.author} title={post.title} slug={post.slug} />
        </div>
      </article>
      {/* <hr className="border-accent-2 mt-28 mb-24" /> */}
      {morePosts?.length > 0 && (
        <section className="mx-auto w-full max-w-7xl pb-14 pt-12 sm:py-20 lg:pt-24">
          <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-screen-2xl">
            <h2 className="relative border-b border-slate-300 pb-2 font-archivo text-2xl font-black text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
              Related Articles
            </h2>
            <div className="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3">
              {morePosts.map((post) => (
                <VerticalArticleCard key={post._id} article={post} />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  )
}
