import ArticleCard from '@/components/article-card'
import { type Post } from '@/types'

export default function ArticleFeed({ articles }: { articles: Post[] }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article: Post, index: number) => (
        <ArticleCard
          key={article._id}
          title={article.title}
          image={article.mainImage}
          slug={article.slug}
          author={article.author.name}
          date={article.publishedAt}
          division={article.division}
          conferences={article.conferences}
          headingLevel="h2"
          imagePriority={index < 4}
        />
      ))}
    </div>
  )
}
