import { FC } from 'react'

import MinimalHorizontalCard from '@components/ui/MinimalHorizontalCard'

import type { Post } from '@types'

interface FeaturedArticlesProps {
  featuredArticles: Post[]
}

const FeaturedArticles: FC<FeaturedArticlesProps> = ({ featuredArticles }) => (
  <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
    <h2 className="relative border-b border-slate-300 pb-2 font-archivo text-2xl font-semibold text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
      Featured
    </h2>
    <div className="space-y-6 pt-6 sm:space-y-5 lg:space-y-6 xl:space-y-5">
      {featuredArticles.map((featuredArticle) => (
        <MinimalHorizontalCard
          key={featuredArticle._id}
          analyticsGoal="clickOnFeaturedArticle"
          article={featuredArticle}
        />
      ))}
    </div>
  </div>
)

export default FeaturedArticles
