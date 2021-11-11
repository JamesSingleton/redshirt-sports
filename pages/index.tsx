import { Layout } from '@components/common'
import { Hero, FeaturedArticleSection, ArticlesSection } from '@components/home'

function Home() {
  return (
    <div className="sm:py-10 max-w-3xl mx-auto sm:px-6 lg:max-w-8xl lg:px-8 lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-9">
        <Hero />
      </div>
      <aside className="px-4 py-4 sm:px-0 sm:py-0 lg:col-span-3">
        <div className="sticky top-28 space-y-4">
          <ArticlesSection />
          <FeaturedArticleSection />
        </div>
      </aside>
    </div>
  )
}

Home.Layout = Layout

export default Home
