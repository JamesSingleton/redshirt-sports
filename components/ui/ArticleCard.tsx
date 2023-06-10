import Image from 'next/image'
import Link from 'next/link'

import { Date } from '@components/ui'
import { urlForImage } from '@lib/sanity.image'

type ArticleCardProps = {
  title: string
  excerpt: string
  date: string
  image: any
  slug: string
  parentCategory: {
    title: string
    slug: string
  }
  subcategory: {
    title: string
    slug: string
    parentSlug: string
  }
}

const ArticleCard = ({
  title,
  excerpt,
  date,
  image,
  slug,
  parentCategory,
  subcategory,
}: ArticleCardProps) => {
  return (
    <div>
      <Link
        href={`/${slug}`}
        className="aspect-h-1 aspect-w-2 relative block overflow-hidden rounded-2xl shadow-md"
      >
        <Image
          src={urlForImage(image).url()}
          alt={image.caption}
          className="h-full w-full object-cover"
          width={363}
          height={181}
          title={image.caption}
        />
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/news/${parentCategory.slug}`} className="inline-block">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-0.5 text-sm font-medium text-brand-800">
              {parentCategory.title}
            </span>
          </Link>
          {subcategory && (
            <Link
              href={`/news/${subcategory.parentSlug}/${subcategory.slug}`}
              className="inline-block"
            >
              <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-0.5 text-sm font-medium text-brand-800">
                {subcategory.title}
              </span>
            </Link>
          )}
        </div>
        <span className="text-sm">•</span>
        <Date dateString={date} />
      </div>
      <Link href={`/${slug}`} className="mt-4 block">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      </Link>
    </div>
  )
}

export default ArticleCard
