import LatestStory from './LatestStory'
import RecentArticles from './RecentArticles'
import { getHeroPost, getRecentArticles } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'

const Hero = async () => {
  const token = getPreviewToken()
  const mainArticle = await getHeroPost({ token })

  const recentArticles = await getRecentArticles({ token })

  return (
    <section className="py-4 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:flex lg:max-w-7xl lg:items-start lg:px-8">
        <LatestStory post={mainArticle!} />
        <RecentArticles recentArticles={recentArticles!} />
      </div>
    </section>
  )
}

export default Hero
