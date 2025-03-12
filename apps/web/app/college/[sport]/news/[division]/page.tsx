import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>
}): Promise<Metadata> {
  const { sport, division } = await params

  // title case sport
  const sportTitleCase = sport.charAt(0).toUpperCase() + sport.slice(1)

  return {
    title: `Latest ${division.toUpperCase()} ${sportTitleCase} News | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Discover the latest articles and insights on ${division.toUpperCase()} ${sport}. Get comprehensive coverage at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
  }
}


export default async function Page({
  params,
}: {
  params: Promise<{ sport: string; division: string }>
}) {
  const {sport, division} = await params

  return (
    <div>
      <h1>{sport} News - {division}</h1>
    </div>
  )
}