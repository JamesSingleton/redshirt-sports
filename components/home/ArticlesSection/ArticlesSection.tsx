import { FC } from 'react'
import Link from 'next/link'
import type { Post } from '@lib/types/post'
import { usePlausible } from 'next-plausible'

const latestArticles = [
  {
    title: "Huskers stick with Frost, restructure coach's deal",
    preview:
      "Scott Frost will return as Nebraska's coach in 2022 with a restructured contract, athletic director Trev Alberts announced Monday.",
  },
  {
    title: "UF's Richardson injures knee dancing at team hotel",
    preview:
      "Florida quarterback Anthony Richardson, who recently emerged as the team's starter, injured his knee while dancing at the team hotel the night before a 40-17 loss at South Carolina on Saturday.",
  },
  {
    title: 'Harbaugh: Big Ten admits to errors in MSU game',
    preview:
      "Jim Harbaugh told reporters on Monday that the Big Ten Conference acknowledged officiating mistakes in Michigan's 37-33 loss to Michigan State on Oct. 30.",
  },
]

interface ArticleSectionProps {
  posts: Post[]
}

const ArticlesSection: FC<ArticleSectionProps> = ({ posts }) => {
  const plausible = usePlausible()
  return (
    <section>
      <div className="bg-white rounded-lg shadow">
        <h2 className="h-11 mx-3 flex items-center justify-between text-base font-medium text-gray-900 border-b border-gray-300">
          Recent Headlines
        </h2>
        <div className="m-3 mt-0">
          <ul role="list" className="divide-y divide-gray-200">
            {posts.map(({ title, excerpt, slug }) => (
              <li key={title} className="py-5">
                <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                  <h3 className="text-sm font-semibold text-gray-800">
                    <Link href={`/${slug}`} prefetch={false}>
                      <a
                        className="hover:underline focus:outline-none"
                        onClick={() =>
                          plausible('clickOnRecentHeadlines', {
                            props: {
                              title: title,
                            },
                          })
                        }
                      >
                        {/* Extend touch target to entire panel */}
                        <span className="absolute inset-0" aria-hidden="true" />
                        {title}
                      </a>
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {excerpt}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default ArticlesSection
