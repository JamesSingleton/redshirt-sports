import type { Author } from "@redshirt-sports/sanity/types";

import ArticleCard from "@/components/article-card";

type ArticleFeedItem = {
  _id: string;
  title: string;
  mainImage: any;
  slug: string;
  authors: unknown[];
  publishedAt?: string | null;
};

export default function ArticleFeed({
  articles,
}: {
  articles: ArticleFeedItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article, index) => {
        const authorName = (article.authors[0] as unknown as Author)?.name;
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
        );
      })}
    </div>
  );
}
