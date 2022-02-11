import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'
import { urlForImage } from '@lib/sanity'
import type { AuthorTypes } from '@lib/types/author'

interface OtherAuthorsProps {
  otherAuthors: AuthorTypes[]
}

const OtherAuthors: FC<OtherAuthorsProps> = ({ otherAuthors }) => {
  const plausible = usePlausible()
  return (
    <div className="overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700 xl:p-5">
        <h2 className="grow text-lg font-semibold text-slate-900 dark:text-slate-50">
          Discover Authors
        </h2>
        <Link href="/authors" prefetch={false}>
          <a className="block shrink-0 text-sm font-semibold text-indigo-700 dark:text-sky-500">
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
              <a
                onClick={() =>
                  plausible('clickOnOtherAuthors', {
                    props: {
                      author: author.name,
                    },
                  })
                }
                className="flex items-center p-4 hover:bg-slate-200 dark:hover:bg-slate-700 xl:p-5"
              >
                <div className="relative mr-4 inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-semibold uppercase text-slate-100 shadow-inner">
                  <Image
                    className="absolute inset-0 h-full w-full object-cover"
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
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {author.name}
                  </h3>
                  <span className="mt-1 block text-xs">{author.role}</span>
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
