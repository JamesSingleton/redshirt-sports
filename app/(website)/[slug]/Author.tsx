import Link from 'next/link'

import { ImageComponent } from '@/components/common'

import type { Author } from '@/types'

export const AuthorItem = (author: Author) => {
  return (
    <div className="flex min-h-10 flex-row items-center justify-start gap-3 p-0">
      <span
        className="relative h-9 w-9 overflow-hidden rounded-full align-top"
        aria-label={`Avatar for ${author.name}`}
        role="img"
      >
        <ImageComponent
          image={author.image}
          alt={author.name}
          className="h-full w-full max-w-full"
          width={36}
          height={36}
        />
      </span>
      <div className="flex flex-col items-stretch justify-start gap-0.5">
        <Link href={`/authors/${author.slug}`} prefetch={false}>
          <p className="mr-1 whitespace-nowrap text-sm font-semibold tracking-[-.01em]">
            {author.name}
          </p>
        </Link>
        <p className="min-h-4 whitespace-nowrap text-sm/4 font-normal tracking-[-.01em] text-muted-foreground">
          {author.roles.join(', ')}
        </p>
      </div>
    </div>
  )
}

export const AuthorSection = ({ author, authors }: { author: Author; authors: Author[] }) => (
  <div className="hidden lg:sticky lg:left-0 lg:top-24 lg:flex lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:self-start">
    <p className="text-sm font-normal text-muted-foreground">Written By</p>
    {/* if author and no authors just render a single author, if authors is there, map over it */}
    {authors === null ? (
      <AuthorItem {...author} />
    ) : (
      authors.map((author) => <AuthorItem key={author._id} {...author} />)
    )}
  </div>
)

export const MobileAuthorSection = ({ author, authors }: { author: Author; authors: Author[] }) => (
  <div className="lg:hidden">
    <p className="text-sm font-normal text-muted-foreground">Written By</p>
    <div className="relative -mx-6 mt-3 flex overflow-x-auto border-b border-border px-6">
      <div className="flex-1 pb-4">
        <div className="flex flex-row items-stretch justify-start gap-4">
          {authors === null ? (
            <AuthorItem {...author} />
          ) : (
            authors.map((author) => <AuthorItem key={author._id} {...author} />)
          )}
        </div>
      </div>
    </div>
  </div>
)
