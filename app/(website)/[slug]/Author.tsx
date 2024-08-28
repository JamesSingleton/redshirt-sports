import Link from 'next/link'
import { Image as SanityImage } from 'next-sanity/image'

import { urlForImage } from '@/lib/sanity.image'

import type { Author } from '@/types'

export const AuthorItem = (author: Author) => {
  return (
    <div className="flex min-h-10 flex-row items-center justify-start gap-3 p-0">
      <SanityImage
        src={urlForImage(author.image)
          ?.height(36)
          .width(36)
          .ignoreImageParams()
          .crop('entropy')
          .url()}
        alt={author.name}
        className="relative h-9 w-9 rounded-full align-top"
        width={36}
        height={36}
      />
      <div className="flex flex-col items-stretch justify-start gap-0.5">
        {author.archived ? (
          <p className="mr-1 whitespace-nowrap text-sm font-semibold tracking-[-.01em]">
            {author.name}
          </p>
        ) : (
          <Link href={`/authors/${author.slug}`} prefetch={false}>
            <p className="mr-1 whitespace-nowrap text-sm font-semibold tracking-[-.01em] hover:underline">
              {author.name}
            </p>
          </Link>
        )}
        <p className="min-h-4 whitespace-nowrap text-sm/4 font-normal tracking-[-.01em] text-muted-foreground">
          {author.roles.join(', ')}
        </p>
      </div>
    </div>
  )
}

export const AuthorSection = ({ author, authors }: { author: Author; authors: Author[] }) => (
  <>
    <p className="text-sm font-normal text-muted-foreground">Written By</p>
    {authors === null ? (
      <AuthorItem key={author._id} {...author} />
    ) : (
      authors.map((author) => <AuthorItem key={author._id} {...author} />)
    )}
  </>
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
            authors.map((author) => <AuthorItem key={`${author._id}_mobile`} {...author} />)
          )}
        </div>
      </div>
    </div>
  </div>
)
