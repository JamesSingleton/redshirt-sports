import ArticleCard from '@/components/article-card'
import { Post, Author } from '@redshirt-sports/sanity/types'

export default function ArticleFeed({ articles }: { articles: Post[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article: Post, index: number) => {
        const authorName = (article.authors[0] as unknown as Author)?.name
        return (
          <ArticleCard
            key={article._id}
            title={article.title}
            image={article.mainImage}
            slug={article.slug}
            author={authorName}
            date={article.publishedAt}
            headingLevel="h2"
            imagePriority={index < 4}
          />
        )
      })}
    </div>
  )
}
