import { FC } from 'react'
import type { Post } from '@lib/types/post'
import { Card } from '@components/ui'

interface RecentArticlesProps {
  posts: Post[]
  authorName: string
}
const RecentArticles: FC<RecentArticlesProps> = ({ posts, authorName }) => {
  return (
    <div className="py-16 lg:py-24">
      <div className="flex flex-col mb-4 relative">
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-50">
              Latest Articles
            </h2>
            <span className="mt-2 md:mt-3 font-normal block text-base sm:text-xl">
              {`Discover the latest articles written by ${authorName}`}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => (
          <Card
            post={post}
            key={post.title}
            location="Authors Latest Articles"
          />
        ))}
      </div>
    </div>
  )
}

export default RecentArticles
