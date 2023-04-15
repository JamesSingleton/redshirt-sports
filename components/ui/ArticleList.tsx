import { HorizontalCard, Pagination } from '@components/ui'

import type { Post } from '@types'

interface ArticleListProps {
  articles: Post[]
  currentPage: number
  totalPages: number
  totalPosts: number
}

export default function ArticleList({
  articles,
  currentPage,
  totalPages,
  totalPosts,
}: ArticleListProps) {
  const nextDisabled = currentPage === totalPages
  const prevDisabled = currentPage === 1

  return (
    <>
      {articles.map((post) => (
        <HorizontalCard {...post} key={post._id} />
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
