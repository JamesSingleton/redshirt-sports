import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'

import { getSchoolsByDivision } from '@/lib/sanity.fetch'
import Top25 from '@/components/forms/top-25'
import { getLatestVoterBallotWithSchools, hasVoterVoted } from '@/server/queries'
import { getCurrentWeek } from '@/utils/getCurrentWeek'

import { type Metadata } from 'next'
import { getCurrentSeason } from '@/utils/getCurrentSeason'
import { CardHeader, CardTitle, CardContent, Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

export async function generateStaticParams() {
  const divisions = ['fbs', 'fcs', 'd2', 'd3']

  return divisions.map((division) => ({ division }))
}

const previousBallots = {
  'Week 10': [
    { name: 'North Dakota State', logo: '/placeholder.svg?height=32&width=32' },
    { name: 'South Dakota State', logo: '/placeholder.svg?height=32&width=32' },
    { name: 'Montana State', logo: '/placeholder.svg?height=32&width=32' },
    // ... (include all 25 teams)
  ],
  'Week 9': [
    { name: 'South Dakota State', logo: '/placeholder.svg?height=32&width=32' },
    { name: 'North Dakota State', logo: '/placeholder.svg?height=32&width=32' },
    { name: 'Montana State', logo: '/placeholder.svg?height=32&width=32' },
    // ... (include all 25 teams)
  ],
  'Week 8': [
    { name: 'Montana State', logo: '/placeholder.svg?height=32&width=32' },
    { name: 'North Dakota State', logo: '/placeholder.svg?height=32&width=32' },
    { name: 'South Dakota State', logo: '/placeholder.svg?height=32&width=32' },
    // ... (include all 25 teams)
  ],
}

export const metadata: Metadata = {
  title: `College Football Top 25 Voting | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: 'Vote for the top 25 college football teams.',
  robots: {
    follow: false,
    index: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
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
      'Cast your vote for the top 25 playoff eligible Football Championship Subdivision (FCS) football teams.',
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
  const votingWeek = await getCurrentWeek()
  const { year } = await getCurrentSeason()
  const hasVoted = await hasVoterVoted({ year, week: votingWeek, division })

  const schools = await getSchoolsByDivision(division)

  if (hasVoted) {
    redirect(`/vote/${division}/confirmation`)
  }

  if (!schools) {
    notFound()
  }
  const userId = 'user_2kA12TfW2tSo9VYay01FzIUrEVh'
  const latestBallot = await getLatestVoterBallotWithSchools(userId, division)
  const header = divisionHeader.find((d) => d.division === division)
  const { title, subtitle } = header || { title: '', subtitle: '' }

  return (
    <div className="container">
      {title && subtitle && (
        <div className="space-y-4 pt-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>
      )}
      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Previous Ballot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestBallot.map((team, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-8 text-right font-bold">{index + 1}.</span>
                  <div className="flex flex-grow items-center space-x-2">
                    <Image
                      src={team.schoolImageUrl}
                      alt={`${team.schoolName} logo`}
                      width={32}
                      height={32}
                      unoptimized={true}
                    />
                    <span>{team.schoolShortName}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Current Week's Ballot</CardTitle>
          </CardHeader>
          <CardContent className="pr-4">
            <Top25 schools={schools} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
