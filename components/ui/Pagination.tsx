import clsx from 'clsx'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'

import { usePagination, DOTS } from '@lib/usePagination'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

const Pagination = ({ currentPage, totalPages, basePath }: PaginationProps) => {
  const siblingCount = 1
  const paginationRange = usePagination({
    currentPage,
    totalPages,
    siblingCount,
  })

  if (currentPage === 0 || paginationRange!.length < 2) {
    return null
  }

  // const onNext = () => {
  //   onPageChange(currentPage + 1)
  // }

  // const onPrevious = () => {
  //   onPageChange(currentPage - 1)
  // }

  let lastPage = paginationRange![paginationRange!.length - 1]

  return (
    <nav
      className="flex items-center justify-between"
      role="navigation"
      aria-label="Pagination Navigation"
    >
      <div className="flex w-0 flex-1">
        <Link href={`${basePath}/page/${currentPage - 1}`}>
          <a className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-50 px-4 text-sm font-medium text-slate-500 transition duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-700">
            <ChevronLeftIcon className="mr-3 h-5 w-5 text-slate-400" />
            Previous
          </a>
        </Link>
      </div>
      <div className="hidden space-x-3 md:flex">
        {paginationRange!.map((pageNumber) => {
          if (pageNumber === DOTS) {
            return (
              <span
                key="dots"
                className="inline-flex h-12 w-12 items-center justify-center text-base font-medium text-slate-500"
              >
                ...
              </span>
            )
          }
          return (
            <Link key={pageNumber} href={`${basePath}/page/${pageNumber}`}>
              <a
                aria-current={pageNumber === currentPage ? 'page' : undefined}
                className={clsx(
                  'inline-flex h-12 w-12 items-center justify-center rounded-xl text-sm font-medium',
                  pageNumber === currentPage
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                {pageNumber}
              </a>
            </Link>
          )
        })}
      </div>
      <div className="flex w-0 flex-1 justify-end">
        <Link href={`${basePath}/page/${currentPage + 1}`}>
          <a
            className={clsx(
              'inline-flex h-12 items-center justify-center rounded-xl bg-slate-50 px-4 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              currentPage === totalPages ? 'disabled pointer-events-none cursor-not-allowed' : ''
            )}
          >
            Next
            <ChevronRightIcon className="ml-3 h-5 w-5 text-slate-400" />
          </a>
        </Link>
      </div>
    </nav>
  )
}

export default Pagination
