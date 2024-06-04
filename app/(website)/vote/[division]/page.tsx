import { getSchoolsByDivision } from '@/lib/sanity.fetch'
import Top25 from '@/components/forms/top-25'

export async function generateStaticParams() {
  const divisions = ['fbs', 'fcs', 'd2', 'd3']

  return divisions.map((division) => ({ division }))
}

export default async function VotePage({ params }: { params: { division: string } }) {
  const { division } = params
  const schools = await getSchoolsByDivision(division)

  // console.log(schools)
  return (
    <div className="container">
      <div className="space-y-4 pt-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          FCS Football Top 25 Voting
        </h1>
        <p className="text-lg text-muted-foreground">
          Cast your vote for the top 25 Football Championship Subdivision (FCS) football teams.
        </p>
      </div>
      <div className="mx-auto my-8 max-w-4xl">
        <Top25 schools={schools} />
      </div>
    </div>
  )
}
