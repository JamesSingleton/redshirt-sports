import { FC } from 'react'

import { MinimalHorizontalCard } from '@components/ui'

import type { Post } from '@types'

interface MostReadProps {
  mostReadArticles: Post[]
}

const MostRead: FC<MostReadProps> = ({ mostReadArticles }) => (
  <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
    <h2 className="relative border-b border-slate-300 pb-2 font-cal text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
      Most Read
    </h2>
    <div className="space-y-6 pt-6 sm:space-y-5 lg:space-y-6 xl:space-y-5">
      {mostReadArticles.map((mostReadArticle) => (
        <MinimalHorizontalCard
          key={mostReadArticle._id}
          analyticsGoal="clickOnPopularPost"
          article={mostReadArticle}
        />
      ))}
    </div>
  </div>
)

export default MostRead
