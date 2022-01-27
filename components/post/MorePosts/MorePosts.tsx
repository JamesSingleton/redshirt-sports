import { FC } from 'react'
import type { Post } from '@lib/types/post'
import { usePlausible } from 'next-plausible'
import { Card } from '@components/ui'

interface MorePostsProps {
  morePosts: Post[]
}

const MorePosts: FC<MorePostsProps> = ({ morePosts }) => {
  const plausible = usePlausible()
  return (
    <div className="relative mt-16 bg-slate-100 py-16 dark:bg-slate-800 lg:mt-28 lg:py-28">
      <div className="container mx-auto px-4 xl:px-32">
        <div className="relative mb-10 flex max-w-2xl flex-col justify-between text-slate-900 dark:text-slate-50 sm:flex-row sm:items-end">
          <h2 className="text-3xl font-semibold md:text-4xl">Related Posts</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {morePosts.map((post) => (
            <Card key={post.title} post={post} location="Article" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MorePosts
