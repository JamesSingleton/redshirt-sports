import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@lib/sanity'
import type { AuthorTypes } from '@lib/types/author'

interface OtherAuthorsProps {
  otherAuthors: AuthorTypes[]
}

const OtherAuthors: FC<OtherAuthorsProps> = ({ otherAuthors }) => {
  return (
    <div className="rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
      <div className="flex items-center justify-between p-4 xl:p-5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg text-slate-900 dark:text-slate-50 font-semibold grow">
          Discover Authors
        </h2>
        <Link href="/authors" prefetch={false}>
          <a className="shrink-0 block text-indigo-700 dark:text-indigo500 font-semibold text-sm">
            View all
          </a>
        </Link>
      </div>
      <div className="flow-root">
        <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
          {otherAuthors?.map((author) => (
            <Link
              href={`/authors/${author.slug}`}
              prefetch={false}
              key={author.name}
            >
              <a className="flex items-center p-4 xl:p-5 hover:bg-slate-200 dark:hover:bg-slate-700">
                <div className="relative shrink-0 inline-flex items-center justify-center overflow-hidden text-slate-100 uppercase font-semibold shadow-inner rounded-full h-10 w-10 text-base mr-4">
                  <Image
                    className="absolute inset-0 w-full h-full object-cover"
                    src={
                      urlForImage(author.image)
                        .width(40)
                        .height(40)
                        .fit('min')
                        .url()!
                    }
                    alt={`Profile image for author ${author.name}`}
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <h3 className="text-base text-slate-900 dark:text-slate-50 font-semibold">
                    {author.name}
                  </h3>
                  <span className="block mt-1 text-xs">{author.role}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OtherAuthors
