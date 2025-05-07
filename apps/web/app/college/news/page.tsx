import { perPage } from '@/lib/constants'
import { sanityFetch } from '@/lib/sanity/live'

import type { Metadata } from 'next'

async function fetchCollegeNews({pageIndex}: {pageIndex: number}) {
  return await sanityFetch({
    query: `{
      "posts": *[_type == "post" && sport->title match "College"] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}] {
        title,
        slug,
        publishedAt,
        sport-> {
          title
        },
        author-> {
          name,
          image
        },
        mainImage {
          asset-> {
            url
          }
        }
      },
      "totalPosts": count(*[_type == "post" && sport->title match "College"])
    }`,
    params: {
      pageIndex
    }
  })
}

export default async function CollegeSportsNews({
  params,
  searchParams
}: {
  params: Promise<{ sport: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {

  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const { data: { posts, totalPosts } } = await fetchCollegeNews({ pageIndex })

  return (
    <div className="container">
      <h1>College Sports News</h1>
      <p>Coming soon...</p>
    </div>
  )
}