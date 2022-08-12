import { getPathFromSlug } from '@lib/urls'

const getPaginationHref = (pageNumber: number, totalPageCount: number): string => {
  if (pageNumber <= 1) {
    return '/'
  }

  if (pageNumber >= totalPageCount) {
    return getPathFromSlug(`page/${totalPageCount}`)
  }

  return `?page=${pageNumber}`
}

const Pagination = ({
  pageNumber,
  totalPageCount,
}: {
  pageNumber: number
  totalPageCount: number
}) => {
  const prevPageNumber = pageNumber - 1
  const nextPageNumber = pageNumber + 1
  return (
    <div>
      <a
        href={getPaginationHref((pageNumber = prevPageNumber), totalPageCount)}
        rel={pageNumber === 1 ? 'current' : undefined}
        className="nav-link"
      >
        Previous
      </a>
      <span>
        Page {pageNumber} of {totalPageCount}
      </span>
      <a
        href={getPaginationHref((pageNumber = nextPageNumber), totalPageCount)}
        rel={pageNumber >= totalPageCount ? 'current' : undefined}
        className="nav-link"
      >
        Next
      </a>
    </div>
  )
}

export default Pagination
