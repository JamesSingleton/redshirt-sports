import Link from 'next/link'

import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Image as SanityImage } from '@/components/image'
import Date from '@/components/common/Date'

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
  }
  conferences: {
    shortName: string
    name: string
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
          {division && <Badge>{division.name}</Badge>}
          {conferences &&
            conferences.map((conference) => (
              <Badge key={conference.shortName ?? conference.name}>
                {conference.shortName ?? conference.name}
              </Badge>
            ))}
        </div>
        <Heading className="mb-2 text-lg font-semibold">
          <Link href={`/${slug}`} className="transition-colors hover:text-primary" prefetch={false}>
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
