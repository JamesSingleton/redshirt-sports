import { FC } from 'react'
import { Post } from '@lib/types/post'
import SmallCard from './SmallCard'
import LargeCard from './LargeCard'

interface LatestArticlesProps {
  posts: Post[]
}
const LatestArticles: FC<LatestArticlesProps> = ({ posts }) => {
  const firstTwoArticles = posts.slice(0, 2)
  const thirdArticle = posts.slice(2, 3)
  const lastTwoArticles = posts.slice(4, 6)

  return (
    <div className="pt-16 lg:pt-24">
      <div className="flex flex-col mb-4 relative">
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-50">
              Latest Articles
            </h2>
            <span className="mt-2 md:mt-3 font-normal block text-base sm:text-xl">
              Discover the most outstanding articles in all topics of life
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="grid gap-6">
          {firstTwoArticles.map((article) => (
            <SmallCard key={article.title} post={article} />
          ))}
        </div>
        <div className="lg:col-span-2">
          <LargeCard post={thirdArticle[0]} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1 md:col-span-3 xl:col-span-1">
          {lastTwoArticles.map((article) => (
            <SmallCard key={article.title} post={article} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LatestArticles
