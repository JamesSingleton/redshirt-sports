import LatestStory from './LatestStory'
import RecentArticles from './RecentArticles'

import type { Post } from '@types'

interface HeroProps {
  mainArticle: Post
  recentArticles: Post[]
}
const Hero = ({ mainArticle, recentArticles }: HeroProps) => {
  return (
    <section className="bg-slate-50 py-4 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:flex lg:max-w-screen-2xl lg:items-start lg:px-8">
        <LatestStory post={mainArticle} />
        <RecentArticles recentArticles={recentArticles} />
      </div>
    </section>
  )
}

export default Hero
