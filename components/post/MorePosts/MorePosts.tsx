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
    <div className="relative bg-slate-100 dark:bg-slate-800 py-16 lg:py-28 mt-16 lg:mt-28">
      <div className="container mx-auto px-4 xl:px-32">
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between mb-10 text-slate-900 dark:text-slate-50 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold">Related Posts</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {morePosts.map((post) => (
            <Card key={post.title} post={post} location="Article" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MorePosts
