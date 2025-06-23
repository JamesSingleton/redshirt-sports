import Link from 'next/link'
import { Image as SanityImage } from 'next-sanity/image'

import { urlFor } from '@/lib/sanity/client'

import type { Author } from '@/lib/sanity/sanity.types'

export const AuthorItem = (author: Author) => {
  return (
    <div className="flex min-h-10 flex-row items-center justify-start gap-3 p-0">
      <SanityImage
        src={urlFor(author.image).height(36).width(36).url()}
        alt={author.name}
        className="relative h-9 w-9 rounded-full align-top"
        width={36}
        height={36}
      />
      <div className="flex flex-col items-stretch justify-start gap-0.5">
        {author.archived ? (
          <p className="mr-1 text-sm font-semibold tracking-[-.01em] whitespace-nowrap">
            {author.name}
          </p>
        ) : (
          <Link href={`/authors/${author.slug}`} prefetch={false}>
            <p className="mr-1 text-sm font-semibold tracking-[-.01em] whitespace-nowrap hover:underline">
              {author.name}
            </p>
          </Link>
        )}
        <p className="text-muted-foreground min-h-4 text-sm/4 font-normal tracking-[-.01em] whitespace-nowrap">
          {author.roles.join(', ')}
        </p>
      </div>
    </div>
  )
}

export const AuthorSection = ({ authors }: { authors: Author[] }) => (
  <>
    <p className="text-muted-foreground text-sm font-normal">Written By</p>
    {authors && authors.map((author) => <AuthorItem key={author._id} {...author} />)}
  </>
)

export const MobileAuthorSection = ({ authors }: { authors: Author[] }) => (
  <div className="lg:hidden">
    <p className="text-muted-foreground text-sm font-normal">Written By</p>
    <div className="border-border relative -mx-6 mt-3 flex overflow-x-auto border-b px-6">
      <div className="flex-1 pb-4">
        <div className="flex flex-row items-stretch justify-start gap-4">
          {authors &&
            authors.map((author) => <AuthorItem key={`${author._id}_mobile`} {...author} />)}
        </div>
      </div>
    </div>
  </div>
)
