import { HorizontalCard, Pagination } from '@components/ui'

import type { Post } from '@types'

interface ArticleListProps {
  articles: Post[]
  currentPage: string
  totalPages: number
  totalPosts: number
  path: string
}

export default function ArticleList({
  articles,
  currentPage,
  totalPages,
  totalPosts,
  path,
}: ArticleListProps) {
  const nextDisabled = parseInt(currentPage, 10) === totalPages
  const prevDisabled = parseInt(currentPage, 10) === 1

  return (
    <>
      {articles.map((post) => (
        <HorizontalCard post={post} key={post._id} />
      ))}
      <Pagination
        totalPosts={totalPosts}
        currentPage={currentPage}
        nextDisabled={nextDisabled}
        prevDisabled={prevDisabled}
        path={path}
      />
    </>
  )
}
