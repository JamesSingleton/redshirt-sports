'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@workspace/ui/components/pagination'

import { perPage } from '@/lib/constants'

export default function PaginationControls({ totalPosts }: { totalPosts: number }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentPage = parseInt(searchParams.get('page') || '1')
  const totalPages = Math.ceil(totalPosts / perPage)

  const createPageUrl = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams ?? '')
    params.set('page', pageNumber.toString())
    if (pageNumber === 1 || pageNumber === 0) {
      params.delete('page')
    }

    const pageUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`

    return pageUrl
  }

  const showPages = () => {
    const pages: React.ReactElement[] = []
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      if (i > 0 && i <= totalPages) {
        pages.push(
          <PaginationLink
            key={`${currentPage}${i}`}
            isActive={i === currentPage}
            href={createPageUrl(i)}
          >
            {i}
          </PaginationLink>,
        )
      }
    }
    return pages
  }

  const isPreviousDisabled = currentPage <= 1
  const isNextDisabled = currentPage >= totalPages

  const showEllipsis = totalPages > 3 && (currentPage < totalPages - 1 || currentPage > 2)

  return (
    <Pagination className="mt-12">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={isPreviousDisabled ? undefined : createPageUrl(currentPage - 1)}
            aria-disabled={isPreviousDisabled}
            tabIndex={isPreviousDisabled ? -1 : undefined}
            className={isPreviousDisabled ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
        <PaginationItem>{showPages()}</PaginationItem>
        {showEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            href={isNextDisabled ? undefined : createPageUrl(currentPage + 1)}
            aria-disabled={isNextDisabled}
            tabIndex={isNextDisabled ? -1 : undefined}
            className={isNextDisabled ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
