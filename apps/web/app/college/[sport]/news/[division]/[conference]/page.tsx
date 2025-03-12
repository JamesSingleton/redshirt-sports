export default async function Page({
  params,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>
}) {
  const {sport, division, conference} = await params

  return (
    <div>
      <h1>{sport}</h1>
      <h2>{division}</h2>
      <h3>{conference}</h3>
    </div>
  )
}