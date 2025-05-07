export default async function TeamNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { teamSlug } = await params
  return (
    <div className="container">
      <h1>{teamSlug} News</h1>
      <p>Coming soon...</p>
    </div>
  )
}