import { FC } from 'react'
import type { Post } from '@lib/types/post'
import { ArticleSnippet } from '@components/category'

interface RecentArticlesProps {
  posts: Post[]
  authorName: string
}
const RecentArticles: FC<RecentArticlesProps> = ({ posts, authorName }) => {
  return (
    <>
      <h2 className="text-2xl text-stone-900">{`Recent articles by ${authorName}`}</h2>
      <div className="pt-6">
        {posts.map((post: any) => (
          <ArticleSnippet key={post.title} post={post} />
        ))}
      </div>
    </>
  )
}

export default RecentArticles
