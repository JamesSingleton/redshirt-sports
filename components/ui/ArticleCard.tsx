import Image from 'next/image'
import Link from 'next/link'

import { Date } from '@components/ui'
import ImageComponent from './ImageComponent'
import { badgeVariants } from './Badge'

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
        <ImageComponent
          image={image}
          alt={image.caption}
          className="h-full w-full object-cover"
          width={363}
          height={181}
        />
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/news/${parentCategory.slug}`}
            className={badgeVariants({ variant: 'default' })}
          >
            {parentCategory.title}
          </Link>
          {subcategory && (
            <Link
              href={`/news/${subcategory.parentSlug}/${subcategory.slug}`}
              className={badgeVariants({ variant: 'default' })}
            >
              {subcategory.title}
            </Link>
          )}
        </div>
        <span className="text-sm">•</span>
        <Date dateString={date} />
      </div>
      <Link href={`/${slug}`} className="mt-4 block">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </Link>
    </div>
  )
}

export default ArticleCard
