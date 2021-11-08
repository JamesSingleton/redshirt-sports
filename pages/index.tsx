import Image from 'next/image'

import { Layout } from '@components/common'
import {
  Hero,
  BlogSection,
  FeaturedArticleSection,
  ArticlesSection,
} from '@components/home'

const trendingPosts = [
  {
    id: 1,
    user: {
      name: 'Floyd Miles',
      imageUrl:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    body: 'What books do you have on your bookshelf just to look smarter than you actually are?',
    comments: 291,
  },
]
const tabs = [
  { name: 'Recent', href: '#', current: true },
  { name: 'Trending', href: '#', current: false },
]
const questions = [
  {
    id: '81614',
    likes: '29',
    views: '2.7k',
    author: {
      name: 'James Singleton',
      imageUrl: '/images/james_singleton.png',
      href: '#',
    },
    date: 'December 9 at 11:43 AM',
    datetime: '2020-12-09T11:43:00',
    href: '#',
    title: 'What would you have done differently if you ran Jurassic Park?',
    body: `
      <p>Jurassic Park was an incredible idea and a magnificent feat of engineering, but poor protocols and a disregard for human safety killed what could have otherwise been one of the best businesses of our generation.</p>
      <p>Ultimately, I think that if you wanted to run the park successfully and keep visitors safe, the most important thing to prioritize would be&hellip;</p>
    `,
  },
]
function Home() {
  return (
    <div className="sm:py-10 max-w-3xl mx-auto sm:px-6 lg:max-w-8xl lg:px-8 lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-9">
        <Hero />
      </div>
      <aside className="px-4 py-4 sm:px-0 sm:py-0 lg:col-span-3">
        <div className="sticky top-4 space-y-4">
          <ArticlesSection />
          <FeaturedArticleSection />
        </div>
      </aside>
    </div>
  )
}

Home.Layout = Layout

export default Home
