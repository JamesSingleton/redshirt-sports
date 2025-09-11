import Link from 'next/link'
import { Separator } from '@redshirt-sports/ui/components/separator'

import CustomImage from './sanity-image'
import FormatDate from '@/components/format-date'

import type { Slug } from '@/lib/sanity/sanity.types'

export default function ArticleCard({
  title,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  headingLevel = 'h3',
}: {
  title: string
  image: any
  imagePriority?: boolean
  slug: Slug | string
  author: string
  date: string
  headingLevel?: 'h2' | 'h3' | 'h4'
}) {
  const Heading = headingLevel

  return (
    <div className="border-border overflow-hidden rounded-lg border shadow-lg">
      <CustomImage
        image={image}
        width={600}
        height={400}
        className="h-48 w-full object-cover object-top"
        loading={imagePriority ? 'eager' : 'lazy'}
      />
      <div className="bg-background p-4">
        <Heading className="mb-2 text-lg font-semibold">
          <Link
            href={`/${slug}`}
            className="hover:underline hover:decoration-2 hover:underline-offset-1"
            prefetch={false}
          >
            {title}
          </Link>
        </Heading>
        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
          <div>{author}</div>
          <Separator orientation="vertical" className="h-4" />
          <FormatDate dateString={date} />
        </div>
      </div>
    </div>
  )
}
