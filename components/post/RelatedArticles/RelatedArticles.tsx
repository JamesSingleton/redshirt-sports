import { FC } from 'react'
import { PostCard } from '@components/post'
import { Post } from '@lib/types/post'
import styles from './RelatedArticles.module.css'

interface relatedArticlesProps {
  posts: Post[]
}

const RelatedArticles: FC<relatedArticlesProps> = ({ posts }) => {
  return (
    <div className="my-10 mx-7 sm:mx-0">
      <h2 className="text-2xl border-b-2 border-slate-800">Related Articles</h2>
      <div className={styles.relatedArticlesWrapper}>
        {posts && posts.map((post) => <PostCard post={post} key={post._id} />)}
      </div>
    </div>
  )
}
export default RelatedArticles
