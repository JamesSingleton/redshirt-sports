import Link from 'next/link'

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
  const prevPageUrl = currentPage === 2 ? slug : `${slug}?page=${currentPage - 1}`
  const nextPageUrl = `${slug}?page=${currentPage + 1}`

  const from = (currentPage - 1) * 10 + 1
  const to = currentPage * 10 > totalPosts ? totalPosts : currentPage * 10

  return (
    <nav
      className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6"
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-slate-700">
          Showing <span className="font-medium">{from}</span> to{' '}
          <span className="font-medium">{to}</span> of{' '}
          <span className="font-medium">{totalPosts}</span> results
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end">
        {prevDisabled ? (
          <span className="relative inline-flex cursor-not-allowed items-center rounded-md border border-slate-300 bg-slate-300 px-4 py-2 text-sm font-medium text-slate-400 focus:outline-none">
            Previous
          </span>
        ) : (
          <Link
            href={prevPageUrl}
            prefetch={false}
            aria-label="Previous Page"
            className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Link>
        )}
        {nextDisabled ? (
          <span className="relative ml-3 inline-flex cursor-not-allowed items-center rounded-md border border-slate-300 bg-slate-300 px-4 py-2 text-sm font-medium text-slate-400 focus:outline-none">
            Next
          </span>
        ) : (
          <Link
            href={nextPageUrl}
            prefetch={false}
            aria-label="Next Page"
            className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  )
}
