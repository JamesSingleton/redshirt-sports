import { ArticleCard } from '@/components/common'
import { type Post } from '@/types'

export default function ArticleFeed({ articles }: { articles: Post[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
      {articles.map((article: Post, index: number) => (
        <ArticleCard
          index={index}
          key={article._id}
          title={article.title}
          date={article.publishedAt}
          image={article.mainImage}
          slug={article.slug}
          division={article.division}
          conferences={article.conferences}
          author={article.author}
        />
      ))}
    </div>
  )
}
