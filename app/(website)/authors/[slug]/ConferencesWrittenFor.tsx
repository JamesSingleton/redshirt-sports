'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import clsx from 'clsx'

const ConferencesWrittenFor = ({
  conferences,
  slug,
}: {
  conferences: {
    _id: string
    name: string
    path: string
    shortName: string
  }[]
  slug: string
}) => {
  const searchParams = useSearchParams()
  const conferenceParam = searchParams.get('conference')
  const page = searchParams.get('page')
  const filteredConferences = conferences.filter((conference) => conference !== null)

  const inActiveClass =
    'inline-block rounded-full px-4 py-2 text-base font-semibold transition-all duration-200 hover:bg-accent hover:text-accent-foreground font-serif'
  const activeClass =
    'inline-block rounded-full  bg-accent px-4 py-2 text-base font-semibold text-accent-foreground transition-all duration-200 font-serif'

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link
        href={`/authors/${slug}`}
        className={clsx(conferenceParam === null ? activeClass : inActiveClass)}
        title="All Articles"
        prefetch={false}
      >
        All Articles
      </Link>
      {filteredConferences?.map((conference) => (
        <Link
          prefetch={false}
          key={conference._id}
          href={{
            pathname: `/authors/${slug}`,
            query: {
              conference: conference.name,
              ...(page && conferenceParam ? { page } : {}),
            },
          }}
          className={clsx(conferenceParam === conference.name ? activeClass : inActiveClass)}
          title={`${conference.name} Articles`}
        >
          {conference.shortName ?? conference.name}
        </Link>
      ))}
    </div>
  )
}

export default ConferencesWrittenFor
