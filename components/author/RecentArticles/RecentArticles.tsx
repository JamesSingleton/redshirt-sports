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
      <div className="relative mb-4 flex flex-col">
        <div className="relative mb-6 flex flex-col justify-between sm:flex-row sm:items-end md:mb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-50 md:text-4xl">
              Latest Articles
            </h2>
            <span className="mt-2 block text-base font-normal sm:text-xl md:mt-3">
              {`Discover the latest articles written by ${authorName}`}
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
