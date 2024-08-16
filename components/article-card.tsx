import Link from 'next/link'

import { Separator } from '@/components/ui/separator'
import { badgeVariants } from '@/components/ui/badge'
import { Image as SanityImage } from '@/components/image'
import Date from '@/components/date'

export default function ArticleCard({
  title,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  division,
  conferences,
  headingLevel = 'h3',
}: {
  title: string
  image: any
  imagePriority?: boolean
  slug: string
  author: string
  date: string
  division: {
    name: string
    slug: string
  }
  conferences: {
    shortName: string
    name: string
    slug: string
  }[]
  headingLevel?: 'h2' | 'h3' | 'h4'
}) {
  const Heading = headingLevel

  return (
    <div className="overflow-hidden rounded-lg border border-border shadow-lg">
      <SanityImage
        src={image}
        alt={image.caption}
        width={600}
        height={400}
        className="h-48 w-full object-cover object-top"
        priority={imagePriority}
      />
      <div className="bg-background p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {division && (
            <Link href={`/news/${division.slug}`} prefetch={false} className={badgeVariants()}>
              {division.name}
            </Link>
          )}
          {conferences &&
            conferences.map((conference) => (
              <Link
                key={conference.shortName ?? conference.name}
                href={`/news/${division.slug}/${conference.slug}`}
                prefetch={false}
                className={badgeVariants()}
              >
                {conference.shortName ?? conference.name}
              </Link>
            ))}
        </div>
        <Heading className="mb-2 text-lg font-semibold">
          <Link
            href={`/${slug}`}
            className="hover:underline hover:decoration-2 hover:underline-offset-1"
            prefetch={false}
          >
            {title}
          </Link>
        </Heading>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <div>{author}</div>
          <Separator orientation="vertical" className="h-4" />
          <Date dateString={date} />
        </div>
      </div>
    </div>
  )
}
