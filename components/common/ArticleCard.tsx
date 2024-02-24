import Link from 'next/link'

import Date from './Date'
import ImageComponent from './ImageComponent'
import { badgeVariants } from '@components/ui/badge'
import { cn } from '@lib/utils'

type ArticleCardProps = {
  title: string
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
  author: {
    name: string
    slug: string
    archived: boolean
  }
  index?: number
}

const ArticleCard = ({
  title,
  date,
  image,
  slug,
  division,
  conferences,
  author,
  index,
}: ArticleCardProps) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow">
      <Link
        href={`/${slug}`}
        className="aspect-h-1 aspect-w-2 relative block overflow-hidden rounded-t-xl shadow-md"
      >
        <ImageComponent
          image={image}
          alt={image.caption}
          width={363}
          height={181}
          loading={index !== undefined && index < 3 ? 'eager' : 'lazy'}
        />
      </Link>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-3">
          {division && (
            <Link
              href={`/news/${division.slug}`}
              className={cn(badgeVariants({ variant: 'default' }), 'font-semibold')}
            >
              {division.name}
            </Link>
          )}
          {conferences &&
            conferences.map((conference) => (
              <Link
                href={`/news/${division.slug}/${conference.slug}`}
                key={conference.slug}
                className={cn(badgeVariants({ variant: 'default' }), 'font-semibold')}
              >
                {conference.shortName ?? conference.name}
              </Link>
            ))}
        </div>

        <h2 className="text-xl font-semibold tracking-tight">
          <Link href={`/${slug}`}>{title}</Link>
        </h2>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center">
            <span className="mr-1">By</span>
            <span className="text-card-foreground">{author.name}</span>
          </div>
          <Date dateString={date} />
        </div>
      </div>
    </div>
  )
}

export default ArticleCard
