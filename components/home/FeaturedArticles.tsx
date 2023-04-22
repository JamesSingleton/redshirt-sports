import MinimalHorizontalCard from '@components/ui/MinimalHorizontalCard'
import { getFeaturedArticles } from '@lib/sanity.client'

import { getPreviewToken } from '@lib/sanity.server.preview'

const FeaturedArticles = async () => {
  const token = getPreviewToken()
  const featuredArticles = await getFeaturedArticles({ token })
  return (
    <div className="w-full rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-800 sm:p-8">
      <h2 className="relative border-b border-slate-300 pb-2 font-cal text-2xl font-medium before:absolute before:-bottom-[1px] before:left-0 before:h-px before:w-24 before:bg-brand-500">
        Featured
      </h2>
      <div className="space-y-6 pt-6 sm:space-y-5 lg:space-y-6 xl:space-y-5">
        {featuredArticles!.map((featuredArticle) => (
          <MinimalHorizontalCard
            key={featuredArticle._id}
            analyticsGoal="clickOnFeaturedArticle"
            article={featuredArticle}
          />
        ))}
      </div>
    </div>
  )
}

export default FeaturedArticles
