import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

const Pagination = ({ currentPage, totalPages }: PaginationProps) => {
  return (
    <nav className="flex items-center justify-between">
      <div className="flex w-0 flex-1">
        <a
          href="#"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-50 px-4 text-sm font-medium text-slate-500 transition duration-300 ease-in-out hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronLeftIcon className="mr-3 h-5 w-5 text-slate-400" />
          Previous
        </a>
      </div>
      <div className="hidden space-x-3 md:flex">
        {Array.from({ length: totalPages }).map((_, i) => (
          <Link key={i} href={`/fcs/page/${i + 1}`}>
            <a
              aria-current={i === currentPage - 1 ? 'page' : undefined}
              className={clsx(
                'inline-flex h-12 w-12 items-center justify-center rounded-xl text-sm font-medium',
                i === currentPage - 1
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              {i + 1}
            </a>
          </Link>
        ))}
      </div>
      <div className="flex w-0 flex-1 justify-end">
        <a
          href="#"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-50 px-4 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          Next
          <ChevronRightIcon className="ml-3 h-5 w-5 text-slate-400" />
        </a>
      </div>
    </nav>
  )
}

export default Pagination
