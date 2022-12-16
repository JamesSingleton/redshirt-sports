import { notFound } from 'next/navigation'

import { SocialMediaFollow } from '@components/common'
import { PageHeader, HorizontalCard } from '@components/ui'
import { getSearchResults } from '@lib/sanity.client'

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const query = searchParams?.query
  if (!query) {
    return notFound()
  }
  const searchResults = await getSearchResults(query!)
  return (
    <>
      <PageHeader
        heading="Search Results"
        subheading={`${searchResults.length} results for "${query}"`}
      />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            {searchResults.length > 0 &&
              searchResults.map((post) => <HorizontalCard post={post} key={post._id} />)}
            {!searchResults.length && (
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-20 w-20 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                  />
                </svg>
                <h3 className="font-cal mt-2 text-xl font-medium text-slate-900">No Results</h3>
                <p className="mt-1 text-base text-slate-500">
                  {`We couldn't find a match for "${query}".`}
                </p>
              </div>
            )}
          </div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}
