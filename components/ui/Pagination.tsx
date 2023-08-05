'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { buttonVariants } from './Button'
import { perPage } from '@lib/constants'

export default function Pagination({
  currentPage,
  prevDisabled,
  nextDisabled,
  totalPosts,
  slug,
}: {
  currentPage: number
  prevDisabled: boolean
  nextDisabled: boolean
  totalPosts: number
  slug: string
}) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  // const prevPageUrl = currentPage === 2 ? slug : `${slug}?page=${currentPage - 1}`
  // account for the possibility of a search query and if the currentPage is 2 don't add page param
  const prevPageUrl =
    currentPage === 2
      ? query
        ? `${slug}?q=${query}`
        : slug
      : query
      ? `${slug}?q=${query}&page=${currentPage - 1}`
      : `${slug}?page=${currentPage - 1}`

  const nextPageUrl = query
    ? `${slug}?q=${query}&page=${currentPage + 1}`
    : `${slug}?page=${currentPage + 1}`

  const from = (currentPage - 1) * perPage + 1
  const to = currentPage * perPage > totalPosts ? totalPosts : currentPage * perPage

  return (
    <nav
      className="mt-12 flex items-center justify-between border-t border-zinc-200 py-3"
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Showing <span className="font-medium">{from}</span> to{' '}
          <span className="font-medium">{to}</span> of{' '}
          <span className="font-medium">{totalPosts}</span> results
        </p>
      </div>
      <div className="flex flex-1 justify-between space-x-4 sm:justify-end">
        {prevDisabled ? null : (
          <Link
            href={prevPageUrl}
            aria-label="Previous Page"
            className={buttonVariants({ variant: 'default' })}
          >
            Previous
          </Link>
        )}
        {nextDisabled ? null : (
          <Link
            href={nextPageUrl}
            aria-label="Next Page"
            className={buttonVariants({ variant: 'default' })}
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  )
}
