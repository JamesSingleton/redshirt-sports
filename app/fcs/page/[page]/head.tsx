import DefaultMetaTags from '@components/common/DefaultMetaTags'
import { getTotalPosts } from '@lib/sanity.client'

export default async function Head({ params }: { params: { page: string } }) {
  const totalPosts = await getTotalPosts('FCS')
  const totalPages = Math.ceil(totalPosts / 10)
  const { page } = params
  const prevPageUrl = page === '2' ? '/fcs' : `/fcs/page/${parseInt(page, 10) - 1}`
  const nextPageUrl = `/fcs/page/${parseInt(page, 10) + 1}`
  return (
    <>
      <DefaultMetaTags />
      <link rel="prev" href={`https://www.redshirtsports.xyz${prevPageUrl}`} />
      {parseInt(page, 10) < totalPages && (
        <link rel="next" href={`https://www.redshirtsports.xyz${nextPageUrl}`} />
      )}
    </>
  )
}
