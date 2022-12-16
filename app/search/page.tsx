import { SocialMediaFollow } from '@components/common'
import { PageHeader, HorizontalCard } from '@components/ui'
import { getSearchResults } from '@lib/sanity.client'

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const query = searchParams?.query
  const searchResults = await getSearchResults(query)
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
              searchResults.map((post, key) => (
                <HorizontalCard post={post} key={post._id} articleLocation="Search Results Page" />
              ))}
          </div>
        </div>
      </section>
    </>
  )
}
