import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePlausible } from 'next-plausible'
import { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'

interface FeaturedArticleProps {
  title: string
  post: Post
}
const FeaturedArticle: FC<FeaturedArticleProps> = ({ title, post }) => {
  const plausible = usePlausible()
  return (
    <section aria-labelledby="">
      <div className="bg-white rounded-lg shadow">
        <h2 className="h-11 mx-3 flex items-center justify-between text-base font-medium text-gray-900">
          {title}
        </h2>
        <div className=" flex flex-col overflow-hidden rounded-b-lg">
          <div className="shrink-0">
            <Image
              src={urlForImage(post.mainImage).width(392).height(192).url()!}
              alt={post.mainImage.caption}
              width="392"
              height="192"
              layout="responsive"
              objectFit="cover"
            />
          </div>
          <div className="flex-1 bg-white p-3 flex flex-col justify-between">
            <div className="flex-1">
              <Link href={`/${post.slug}`} prefetch={false}>
                <a
                  className="block mt-2"
                  onClick={() =>
                    plausible('clickOnFeaturedArticle', {
                      props: {
                        title: post.title,
                      },
                    })
                  }
                >
                  <p className="text-xl font-semibold text-gray-900">
                    {post.title}
                  </p>
                  <p className="mt-3 text-base text-gray-500">{post.excerpt}</p>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedArticle
