import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { urlForImage, PortableText } from '@lib/sanity'
import type { AuthorTypes } from '@lib/types/author'

interface WrittenByProps {
  author: AuthorTypes
}

const WrittenBy: FC<WrittenByProps> = ({ author }) => {
  return (
    <div className="max-w-screen-md mx-auto">
      <div className="flex">
        <Link href={`/authors/${author.slug}`} prefetch={false}>
          <a>
            <div className="wil-avatar relative flex-shrink-0 inline-flex items-center justify-center overflow-hidden text-slate-100 uppercase font-semibold shadow-inner rounded-xl h-12 w-12 text-lg sm:text-xl sm:h-24 sm:w-24 ring-1 ring-white dark:ring-slate-900">
              <Image
                className="absolute inset-0 w-full h-full object-cover"
                src={urlForImage(author.image).url()!}
                alt={`Profile image of ${author.name}`}
                width={96}
                height={96}
              />
            </div>
          </a>
        </Link>
        <div className="flex flex-col ml-3 max-w-lg sm:ml-5">
          <span className="text-xs uppercase tracking-wider">written by</span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            <Link href={`/authors/${author.slug}`} prefetch={false}>
              <a>{author.name}</a>
            </Link>
          </h2>
          <span className="text-sm sm:text-base line-clamp-2">
            <PortableText blocks={author.bio} />
          </span>
        </div>
      </div>
    </div>
  )
}

export default WrittenBy
