import { FC, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'

import { urlForImage } from '@lib/sanity'

import type { Post } from '@lib/types/post'

interface HeroProps {
  posts: Post[]
  featuredArticle: Post
}
const Hero: FC<HeroProps> = ({ posts, featuredArticle }) => {
  let [categories] = useState({
    Popular: [
      {
        id: 1,
        title: 'Does drinking coffee make you smarter?',
        date: '5h ago',
        commentCount: 5,
        shareCount: 2,
      },
      {
        id: 2,
        title: "So you've bought coffee... now what?",
        date: '2h ago',
        commentCount: 3,
        shareCount: 2,
      },
    ],
    Recent: [
      {
        id: 1,
        title: 'Is tech making coffee better or worse?',
        date: 'Jan 7',
        commentCount: 29,
        shareCount: 16,
      },
      {
        id: 2,
        title: 'The most innovative things happening in coffee',
        date: 'Mar 19',
        commentCount: 24,
        shareCount: 12,
      },
    ],
  })

  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-7xl px-3">
        <div className="-mx-3 -mt-6 grid gap-4 md:grid-cols-12">
          <div className="md:col-span-8"></div>
          <div className="md:col-span-4">
            <div className="rounded-lg border border-slate-200 py-9 px-7 dark:border-slate-800">
              <div className="mb-7 text-center">
                <h3 className="text-xl font-bold">Recent Posts</h3>
              </div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
