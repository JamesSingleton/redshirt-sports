import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import z from 'zod'
import { CardHeader, CardTitle, CardContent, Card } from '@workspace/ui/components/card'

import Top25 from '@/components/forms/top-25'
import { getLatestVoterBallotWithSchools, hasVoterVoted, getSportIdBySlug } from '@/server/queries'
import { getCurrentWeek, SportSchema, getCurrentSeason, SportParam } from '@/utils/espn'
import { sanityFetch } from '@/lib/sanity/live'
import CustomImage from '@/components/sanity-image'
import { schoolsBySportAndSubgroupingStringQuery } from '@/lib/sanity/query'

import { type Metadata } from 'next'

const ParamsSchema = z.object({
  sport: SportSchema,
  division: z.string(), // Add more specific validation if needed
})

async function fetchSchoolsByDivision(sport: string, division: string) {
  return await sanityFetch({
    query: schoolsBySportAndSubgroupingStringQuery,
    params: { sport, subgrouping: division },
  })
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

export default async function VotePage(props: PageProps<'/vote/college/[sport]/[division]'>) {
  const rawParams = await props.params
  const validationResult = ParamsSchema.safeParse(rawParams)
  if (!validationResult.success) {
    console.error('Invalid params:', validationResult.error)
    notFound()
  }

  const { sport, division } = validationResult.data

  const [votingWeek, { year }] = await Promise.all([
    getCurrentWeek(sport as SportParam),
    getCurrentSeason(sport as SportParam),
  ])

  // Get sport ID for more precise vote checking
  const sportId = await getSportIdBySlug(sport as SportParam)
  const hasVoted = await hasVoterVoted({
    year,
    week: votingWeek,
    division,
    sportId: sportId || '',
  })
  const { userId } = await auth()

  const { data: schools } = await fetchSchoolsByDivision(sport, division)

  if (hasVoted) {
    redirect(`/vote/college/${sport}/${division}/confirmation`)
  }

  if (!schools || !userId) {
    notFound()
  }

  const latestBallot = await getLatestVoterBallotWithSchools(userId, division, sport, year)
  const header = divisionHeader.find((d) => d.division === division)
  const { title, subtitle } = header || { title: '', subtitle: '' }

  return (
    <div className="container">
      {title && subtitle && (
        <div className="space-y-4 pt-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        </div>
      )}
      <div className="flex flex-col gap-6 pt-4 lg:flex-row">
        {latestBallot.length > 0 && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Previous Ballot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestBallot.map((team, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="w-8 text-right font-bold">{index + 1}.</span>
                  <div className="flex flex-grow items-center space-x-2">
                    <CustomImage
                      image={team.schoolImageUrl}
                      width={32}
                      height={32}
                      className="size-8"
                    />
                    <span>{team.schoolShortName}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>New Ballot Submission</CardTitle>
          </CardHeader>
          <CardContent>
            <Top25 schools={schools} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
