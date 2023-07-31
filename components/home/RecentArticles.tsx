import Link from 'next/link'

import { Date, ImageComponent } from '@components/ui'

import type { Post } from '@types'

interface RecentArticlesProps {
  recentArticles: Post[]
}

const RecentArticles = ({ recentArticles }: RecentArticlesProps) => {
  return (
    <div className="mt-12 sm:mt-16 lg:ml-12 lg:mt-0 lg:w-1/2 xl:ml-16">
      <h2 className="relative border-b border-zinc-300 pb-2 font-cal text-2xl font-medium before:absolute before:-bottom-[1px] before:left-0 before:h-px before:w-24 before:bg-brand-500">
        Recent Articles
      </h2>
      <div className="grid divide-y lg:grid-cols-2 lg:gap-5 xl:grid-cols-1">
        {recentArticles.map((post) => (
          <article key={post.title} className="py-8">
            <div className="group md:flex lg:flex-col xl:flex-row xl:items-center">
              <div className="order-2 w-full md:w-2/5 lg:order-1 lg:w-full xl:w-2/5">
                <Link href={`/${post.slug}`} className="aspect-h-9 aspect-w-16 block">
                  <ImageComponent
                    image={post.mainImage}
                    className="overflow-hidden rounded-2xl object-cover"
                    width={358}
                    height={201}
                  />
                </Link>
              </div>
              <div className="order-1 mt-5 w-full px-2 md:mt-0 md:max-w-sm md:pl-0 md:pr-5 lg:order-2 lg:mt-4 xl:ml-5 xl:mt-0 xl:flex-1">
                {/* <Link
                  href={
                    post.subcategory !== null
                      ? `/news/${post.subcategory.parentSlug}/${post.subcategory.slug}`
                      : `/news/${post.category.toLowerCase()}`
                  }
                  className="rounded-sm bg-brand-500 p-1 text-xs font-medium uppercase tracking-widest text-white duration-300 ease-in-out hover:bg-brand-300"
                >
                  {post.subcategory !== null ? post.subcategory.title : post.category}
                </Link> */}
                <h3 className="=transition mt-2 font-cal text-xl font-medium leading-normal tracking-normal duration-300 ease-in-out">
                  <Link href={`/${post.slug}`}>{post.title}</Link>
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center justify-center">
                    <ImageComponent
                      image={post.author.image}
                      className="mr-3 h-6 w-6 overflow-hidden rounded-full"
                      width={48}
                      height={48}
                      alt={`${post.author.name}'s avatar`}
                    />
                    <div className="text-sm">
                      <span className="text-zinc-500 dark:text-zinc-100">By </span>
                      <Link
                        href={`/authors/${post.author.slug}`}
                        className="font-medium text-zinc-700 decoration-inherit dark:text-zinc-200"
                      >
                        {post.author.name}
                      </Link>
                      <span aria-hidden="true"> &middot; </span>
                      <Date dateString={post.publishedAt} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default RecentArticles
