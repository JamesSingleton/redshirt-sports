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
  division: {
    name: string
    slug: string
  }
  conferences: {
    name: string
    shortName: string
    slug: string
  }[]
}

const ArticleCard = ({
  title,
  excerpt,
  date,
  image,
  slug,
  division,
  conferences,
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
          <Link href={`/news/${division.slug}`} className={badgeVariants({ variant: 'default' })}>
            {division.name}
          </Link>
          {conferences &&
            conferences.map((conference) => (
              <Link
                key={conference.slug}
                href={`/news/${division.slug}/${conference.slug}`}
                className={badgeVariants({ variant: 'default' })}
              >
                {conference.shortName ?? conference.name}
              </Link>
            ))}
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
