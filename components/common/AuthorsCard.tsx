import Image from 'next/image'
import Link from 'next/link'

import { getAboutPageAuthors } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'
import { urlForImage } from '@lib/sanity.image'

export default async function AuthorsCard() {
  const token = getPreviewToken()
  const authors = await getAboutPageAuthors({ token })
  return (
    <div className="w-full rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-800">
      <h2 className="relative border-b border-zinc-300 p-4 font-cal text-2xl font-medium text-zinc-900 before:absolute before:-bottom-[1px] before:left-0 before:h-px before:w-24 before:bg-brand-500 dark:text-zinc-100 xl:p-5">
        Authors
      </h2>
      <div className="flow-root">
        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-700">
          {authors?.map((author: any) => (
            <Link
              className="flex items-center p-4 hover:bg-zinc-200 dark:hover:bg-zinc-700 xl:p-5"
              href={`/authors/${author.slug}`}
              key={author._id}
            >
              <div className="relative mr-4 inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-inner">
                <Image
                  alt={author.name}
                  src={urlForImage(author.image).url()}
                  width={40}
                  height={40}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {author.name}
                </h3>
                <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  {author.role}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
