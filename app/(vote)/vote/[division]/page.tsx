import { getSchoolsByDivision } from '@/lib/sanity.fetch'
import Top25 from '@/components/forms/top-25'

export async function generateStaticParams() {
  const divisions = ['fbs', 'fcs', 'd2', 'd3']

  return divisions.map((division) => ({ division }))
}

const divisionHeader = [
  {
    division: 'fbs',
    title: 'Football Bowl Subdivision (FBS)',
    subtitle: 'Cast your vote for the top 25 Football Bowl Subdivision (FBS) football teams.',
  },
  {
    division: 'fcs',
    title: 'Football Championship Subdivision (FCS)',
    subtitle:
      'Cast your vote for the top 25 Football Championship Subdivision (FCS) football teams.',
  },
  {
    division: 'd2',
    title: 'Division II',
    subtitle: 'Cast your vote for the top 25 Division II football teams.',
  },
  {
    division: 'd3',
    title: 'Division III',
    subtitle: 'Cast your vote for the top 25 Division III football teams.',
  },
]

export default async function VotePage({ params }: { params: { division: string } }) {
  const { division } = params
  const schools = await getSchoolsByDivision(division)
  const header = divisionHeader.find((d) => d.division === division)
  const { title, subtitle } = header || { title: '', subtitle: '' }

  // console.log(schools)
  return (
    <div className="container">
      {title && subtitle && (
        <div className="space-y-4 pt-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>
      )}
      <div className="mx-auto my-8 max-w-4xl">
        <Top25 schools={schools} />
      </div>
    </div>
  )
}
