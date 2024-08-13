import { getTeamNewsBySlug } from '@/lib/sanity.fetch'

export default async function TeamNewsPage({ params }: { params: { teamSlug: string } }) {
  const { teamSlug } = params
  const teamNews = await getTeamNewsBySlug(teamSlug)
  console.log(teamNews)
  return (
    <>
      <h1>Hello Team Page</h1>
    </>
  )
}
