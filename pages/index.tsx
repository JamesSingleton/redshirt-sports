import { Layout } from '@components/common'
import { Hero, BlogSection } from '@components/home'

function Home() {
  return (
    <div className="pt-10 bg-gray-900 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
      <Hero />
      <BlogSection />
    </div>
  )
}

Home.Layout = Layout

export default Home
