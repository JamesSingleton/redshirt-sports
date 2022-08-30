import { HorizontalCard, Pagination } from '@components/ui'

import type { Post } from '@types'

interface ArticleListProps {
  articles: Post[]
  currentPage: string
  totalPages: number
  totalPosts: number
}

export default function ArticleList({
  articles,
  currentPage,
  totalPages,
  totalPosts,
}: ArticleListProps) {
  const nextDisabled = parseInt(currentPage, 10) === totalPages
  const prevDisabled = parseInt(currentPage, 10) === 1

  return (
    <>
      {articles.map((post) => (
        <HorizontalCard post={post} key={post._id} articleLocation="FCS Page" />
      ))}
      <Pagination
        totalPosts={totalPosts}
        currentPage={currentPage}
        nextDisabled={nextDisabled}
        prevDisabled={prevDisabled}
      />
    </>
  )
}
