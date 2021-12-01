import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface FeaturedArticleProps {
  title: string
  imageSrc: string
  imageAlt: string
  articleHref: string
  articleTitle: string
  articleSnippet: string
}
const FeaturedArticle: FC<FeaturedArticleProps> = ({
  title,
  imageSrc,
  imageAlt,
  articleHref,
  articleTitle,
  articleSnippet,
}) => {
  return (
    <section aria-labelledby="">
      <div className="bg-white rounded-lg shadow">
        <h2 className="h-11 mx-3 flex items-center justify-between text-base font-medium text-gray-900 border-b border-gray-300">
          {title}
        </h2>
        <div className="mt-6 flex flex-col overflow-hidden rounded-b-lg">
          <div className="flex-shrink-0">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width="392"
              height="192"
              layout="responsive"
              objectFit="cover"
            />
          </div>
          <div className="flex-1 bg-white p-3 flex flex-col justify-between">
            <div className="flex-1">
              <Link href={articleHref}>
                <a className="block mt-2">
                  <p className="text-xl font-semibold text-gray-900">
                    {articleTitle}
                  </p>
                  <p className="mt-3 text-base text-gray-500">
                    {articleSnippet}
                  </p>
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
