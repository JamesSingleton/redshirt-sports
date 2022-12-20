import { getTotalPosts } from '@lib/sanity.client'

export async function generateStaticParams() {
  const totalPosts = await getTotalPosts('FCS')
  const totalPages = Math.ceil(totalPosts / 10)
  const paths = []

  for (let page = 2; page <= totalPages; page++) {
    paths.push({ page: page.toString() })
  }

  return paths
}

export default async function Page({ params }: { params: { page: string } }) {
  const { page } = params

  const prevPageUrl = page === '2' ? '/fcs' : `/fcs/page/${parseInt(page, 10) - 1}`
  const nextPageUrl = `/fcs/page/${parseInt(page, 10) + 1}`

  return (
    <>
      <h1>{`Hello from page ${page}`}</h1>
    </>
  )
}
