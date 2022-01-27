import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'
import { urlForImage, PortableText } from '@lib/sanity'
import type { AuthorTypes } from '@lib/types/author'

interface WrittenByProps {
  author: AuthorTypes
}

const WrittenBy: FC<WrittenByProps> = ({ author }) => {
  const plausible = usePlausible()
  return (
    <div className="mx-auto max-w-screen-md">
      <div className="flex">
        <Link href={`/authors/${author.slug}`} prefetch={false}>
          <a
            onClick={() =>
              plausible('clickOnAuthor', {
                props: {
                  author: author.name,
                  location: 'Written By - Author Image',
                },
              })
            }
          >
            <div className="wil-avatar relative inline-flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-semibold uppercase text-slate-100 shadow-inner ring-1 ring-white dark:ring-slate-900 sm:h-24 sm:w-24 sm:text-xl">
              <Image
                className="absolute inset-0 h-full w-full object-cover"
                src={urlForImage(author.image).url()!}
                alt={`Profile image of ${author.name}`}
                width={96}
                height={96}
              />
            </div>
          </a>
        </Link>
        <div className="ml-3 flex max-w-lg flex-col sm:ml-5">
          <span className="text-xs uppercase tracking-wider">written by</span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            <Link href={`/authors/${author.slug}`} prefetch={false}>
              <a
                onClick={() =>
                  plausible('clickOnAuthor', {
                    props: {
                      author: author.name,
                      location: 'Written By - Author Name',
                    },
                  })
                }
              >
                {author.name}
              </a>
            </Link>
          </h2>
          <span className="text-sm line-clamp-2 sm:text-base">
            <PortableText blocks={author.bio} />
          </span>
        </div>
      </div>
    </div>
  )
}

export default WrittenBy
