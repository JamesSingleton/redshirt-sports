export default async function AuthorPage({params}: {params: Promise<{
  slug: string
}>}) {
  const {slug} = await params

  return (
    <div>
      <h1>{slug}</h1>
    </div>
  )
}