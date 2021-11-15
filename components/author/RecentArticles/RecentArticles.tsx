import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@lib/sanity'

interface RecentArticlesProps {
  posts: [
    {
      _id: string
      _updatedAt: string
      author: {
        name: string
        image: string
        slug: string
      }
      mainImage: string
      publishedAt: string
      slug: string
      title: string
      category: {
        title: string
        description: string
      }
    }
  ]
  authorName: string
}
const RecentArticles: FC<RecentArticlesProps> = ({ posts, authorName }) => {
  return (
    <>
      <h2 className="text-2xl text-warm-gray-900">{`Recent articles by ${authorName}`}</h2>
      <ul className="mt-6">
        {posts.map((post: any) => (
          <li key={post.title} className="flow-root">
            <Link href={`/${post.slug}`}>
              <a className="-m-3 p-3 flex rounded-lg hover:bg-gray-100">
                <div className="flex-shrink-0">
                  <div className="w-52 sm:w-64">
                    <Image
                      className="rounded-md"
                      src={
                        urlForImage(post.mainImage)
                          .width(260)
                          .height(186)
                          .url()!
                      }
                      alt={post.title}
                      width="260"
                      height="186"
                      objectFit="cover"
                      layout="responsive"
                    />
                  </div>
                </div>
                <div className="w-0 flex-1 ml-4 sm:ml-8">
                  <h3 className="text-base text-warm-gray-900 leading-6 font-bold sm:text-2xl">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{post.excerpt}</p>
                </div>
              </a>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

export default RecentArticles
