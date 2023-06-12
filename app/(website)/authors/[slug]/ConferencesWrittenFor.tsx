'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'

import type { Conference } from '@types'

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

  const inActiveClass =
    'inline-block rounded-full px-4 py-2 text-base font-semibold transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900'
  const activeClass =
    'inline-block rounded-full border border-brand-100 bg-brand-100 px-4 py-2 text-base font-semibold text-brand-800 transition-all duration-200'

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link
        href={`/authors/${slug}`}
        className={clsx(conferenceParam === null ? activeClass : inActiveClass)}
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
              ...(page && conferenceParam ? { page } : {}),
            },
          }}
          className={clsx(conferenceParam === conference.title ? activeClass : inActiveClass)}
        >
          {conference.title}
        </Link>
      ))}
    </div>
  )
}

export default ConferencesWrittenFor
