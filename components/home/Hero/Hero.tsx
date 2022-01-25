import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlausible } from 'next-plausible'
import { urlForImage } from '@lib/sanity'
import type { Post } from '@lib/types/post'
import LargeHeroCard from './LargeHeroCard'
import SmallHeroCard from './SmallHeroCard'
import FeaturedHeroCard from './FeaturedHeroCard'

interface HeroProps {
  posts: Post[]
  featuredArticle: Post
}
const Hero: FC<HeroProps> = ({ posts, featuredArticle }) => {
  const plausible = usePlausible()
  const heroPost = posts[0]
  const morePosts = posts.slice(1)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <LargeHeroCard heroPost={heroPost} />
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-5 gap-5">
        {morePosts.map((post) => (
          <SmallHeroCard key={post.title} post={post} />
        ))}
        <FeaturedHeroCard featuredPost={featuredArticle} />
      </div>
    </div>
  )
}

export default Hero
