'use client'

import { Conference } from '@types'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const ConferencesWrittenFor = ({
  conferences,
  slug,
}: {
  conferences: Conference[]
  slug: string
}) => {
  const searchParams = useSearchParams()
  const conferenceParam = searchParams.get('conference')
  const page = searchParams.get('page')

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link
        href={`/authors/${slug}`}
        className="inline-block rounded-full border border-brand-50 bg-brand-50 px-4 py-2 text-base font-semibold text-brand-500 transition-all duration-200"
      >
        All Articles
      </Link>
      {conferences?.map((conference) => (
        <Link
          prefetch={false}
          key={conference._id}
          href={{
            pathname: `/authors/${slug}`,
            query: {
              conference: conference.title,
              // only add page if it's greater than 1 and conference exists
              ...(page && conferenceParam ? { page } : {}),
            },
          }}
          className="inline-block rounded-full px-4 py-2 text-base font-semibold transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900"
        >
          {conference.title}
        </Link>
      ))}
    </div>
  )
}

export default ConferencesWrittenFor
