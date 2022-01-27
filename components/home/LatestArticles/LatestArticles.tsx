import { FC } from 'react'
import { Post } from '@lib/types/post'
import LargeCard from './LargeCard'
import { Card } from '@components/ui'

interface LatestArticlesProps {
  posts: Post[]
}
const LatestArticles: FC<LatestArticlesProps> = ({ posts }) => {
  const firstTwoArticles = posts.slice(0, 2)
  const thirdArticle = posts.slice(2, 3)
  const lastTwoArticles = posts.slice(4, 6)

  return (
    <div className="pt-16 lg:pt-24">
      <div className="relative mb-4 flex flex-col">
        <div className="relative mb-6 flex flex-col justify-between sm:flex-row sm:items-end md:mb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-50 md:text-4xl">
              Latest Articles
            </h2>
            <span className="mt-2 block text-base font-normal sm:text-xl md:mt-3">
              Discover the latest articles written by the members of Redshirt
              Sports
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="grid gap-6">
          {firstTwoArticles.map((article) => (
            <Card
              key={article.title}
              post={article}
              location="Home Page Latest Articles (sm)"
            />
          ))}
        </div>
        <div className="lg:col-span-2">
          <LargeCard post={thirdArticle[0]} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:col-span-3 md:grid-cols-2 xl:col-span-1 xl:grid-cols-1">
          {lastTwoArticles.map((article) => (
            <Card
              key={article.title}
              post={article}
              location="Home Page Latest Articles (sm)"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default LatestArticles
