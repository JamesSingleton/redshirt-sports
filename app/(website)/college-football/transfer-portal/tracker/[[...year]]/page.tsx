import { notFound } from 'next/navigation'

export const dynamicParams = true

export async function generateStaticParams() {
  // Generate static pages for the current year and the previous year
  const currentYear = new Date().getFullYear()
  return [
    { year: [] },
    { year: [currentYear.toString()] },
    { year: [(currentYear - 1).toString()] },
  ]
}

async function getYearData(year: string) {
  // Fetch data for the specified year
  // This is a placeholder function - replace with your actual data fetching logic
  return { year, players: [] }
}

export default async function Page({ params }: { params: { year?: string[] } }) {
  const currentYear = new Date().getFullYear()
  const year = params.year?.[0] || currentYear.toString()

  // Validate the year
  if (parseInt(year) < 2020 || parseInt(year) > currentYear) {
    notFound()
  }

  const data = await getYearData(year)

  return <TransferPortalTracker year={year} data={data} />
}
