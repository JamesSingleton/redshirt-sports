import Link from 'next/link'

import CustomImage from '../sanity-image'

import type { QueryPostSlugDataResult } from '@redshirt-sports/sanity/types'

type PostAuthor = NonNullable<QueryPostSlugDataResult>['authors'][0]

export const AuthorItem = (author: PostAuthor) => {
  return (
    <div className="flex min-h-10 flex-row items-center justify-start gap-3 p-0">
      <CustomImage
        image={author.image}
        className="size-9 rounded-full align-top"
        width={36}
        height={36}
        mode="cover"
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

export const AuthorSection = ({ authors }: { authors: PostAuthor[] }) => (
  <>
    <p className="text-muted-foreground text-sm font-normal">Written By</p>
    {authors && authors.map((author) => <AuthorItem key={author._id} {...author} />)}
  </>
)

export const MobileAuthorSection = ({ authors }: { authors: PostAuthor[] }) => (
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
