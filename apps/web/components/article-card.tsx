import Link from 'next/link'

import CustomImage from './sanity-image'
import FormatDate from '@/components/format-date'

import type { Slug } from '@redshirt-sports/sanity/types'

export default function ArticleCard({
  title,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  headingLevel = 'h3',
  variant = 'default',
}: {
  title: string
  image: any
  imagePriority?: boolean
  slug: Slug | string
  author: string
  date?: string | null
  headingLevel?: 'h2' | 'h3' | 'h4'
  variant?: 'default' | 'compact'
}) {
  const Heading = headingLevel

  if (variant === 'compact') {
    return (
      <Link
        href={`/${slug}`}
        className="group flex gap-4"
        prefetch={false}
      >
        <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md lg:h-24 lg:w-32">
          <CustomImage
            image={image}
            width={128}
            height={96}
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            loading={imagePriority ? 'eager' : 'lazy'}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Heading className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {title}
          </Heading>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{author}</span>
            {date && (
              <>
                <span aria-hidden="true">{'/'}</span>
                <FormatDate dateString={date} />
              </>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/${slug}`}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow duration-200 hover:shadow-md"
      prefetch={false}
    >
      <div className="relative aspect-video overflow-hidden">
        <CustomImage
          image={image}
          width={600}
          height={400}
          className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          loading={imagePriority ? 'eager' : 'lazy'}
        />
      </div>
      <div className="p-4">
        <Heading className="mb-2 line-clamp-2 text-base font-bold leading-snug text-card-foreground transition-colors group-hover:text-primary">
          {title}
        </Heading>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium">{author}</span>
          {date && (
            <>
              <span aria-hidden="true">{'/'}</span>
              <FormatDate dateString={date} />
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
