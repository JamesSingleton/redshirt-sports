import Link from 'next/link'
import { usePlausible } from 'next-plausible'

export default function Pagination({
  currentPage,
  prevDisabled,
  nextDisabled,
  totalPosts,
}: {
  currentPage: string
  prevDisabled: boolean
  nextDisabled: boolean
  totalPosts: number
}) {
  const prevPageUrl = currentPage === '2' ? '/fcs' : `/fcs?page=${parseInt(currentPage, 10) - 1}`
  const nextPageUrl = `/fcs?page=${parseInt(currentPage, 10) + 1}`

  const from = (parseInt(currentPage, 10) - 1) * 10 + 1
  const to =
    parseInt(currentPage, 10) * 10 > totalPosts ? totalPosts : parseInt(currentPage, 10) * 10

  const plausible = usePlausible()
  return (
    <nav
      className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{from}</span> to{' '}
          <span className="font-medium">{to}</span> of{' '}
          <span className="font-medium">{totalPosts}</span> results
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end">
        {prevDisabled ? (
          <span className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Previous
          </span>
        ) : (
          <Link href={prevPageUrl}>
            <a
              onClick={() =>
                plausible('clickOnPagination', {
                  props: {
                    direction: 'previous',
                  },
                })
              }
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </a>
          </Link>
        )}
        {nextDisabled ? (
          <span className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Next
          </span>
        ) : (
          <Link href={nextPageUrl}>
            <a
              onClick={() =>
                plausible('clickOnPagination', {
                  props: {
                    direction: 'next',
                  },
                })
              }
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </a>
          </Link>
        )}
      </div>
    </nav>
  )
}
