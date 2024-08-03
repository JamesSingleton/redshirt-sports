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
} from '@/components/ui/pagination'
import { perPage } from '@/lib/constants'

export default function PaginationControls({ totalPosts }: { totalPosts: number }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const query = searchParams.get('q')
  const currentPage = parseInt(searchParams.get('page') || '1')

  const createPageUrl = (pageNumber: number | string) => {
    let pageUrl: string
    const params = new URLSearchParams(searchParams ?? '')
    params.set('page', pageNumber.toString())
    if (pageNumber === 1 || pageNumber === 0) {
      params.delete('page')
    }

    // only include ? if there are params
    pageUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`

    return pageUrl
  }

  const showPages = () => {
    const pages: any = []
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      if (i > 0 && i <= Math.ceil(totalPosts / perPage)) {
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

  return (
    <Pagination className="mt-12">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={createPageUrl(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
        <PaginationItem>{showPages()}</PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href={createPageUrl(currentPage + 1)}
            aria-disabled={currentPage >= Math.ceil(totalPosts / perPage)}
            tabIndex={currentPage >= Math.ceil(totalPosts / perPage) ? -1 : undefined}
            className={
              currentPage >= Math.ceil(totalPosts / perPage)
                ? 'pointer-events-none opacity-50'
                : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
