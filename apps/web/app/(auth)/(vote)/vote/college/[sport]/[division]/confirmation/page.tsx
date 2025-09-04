import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { buttonVariants } from '@workspace/ui/components/button'

import { getVoterBallots, getSportIdBySlug } from '@/server/queries'
import CustomImage from '@/components/sanity-image'
import { getCurrentWeek, SportParam, getCurrentSeason } from '@/utils/espn'
import { transformBallotToTeamIds } from '@/utils/process-ballots'
import { client } from '@/lib/sanity/client'

import { type Metadata } from 'next'
import { schoolsByIdQuery } from '@/lib/sanity/query'

function generateConfirmationHeader(sport: string, division: string) {
  const sportNames = {
    football: 'College Football',
    'mens-basketball': "Men's College Basketball",
    'womens-basketball': "Women's College Basketball",
  }

  const divisionNames = {
    fbs: 'Football Bowl Subdivision (FBS)',
    fcs: 'Football Championship Subdivision (FCS)',
    d2: 'Division II',
    d3: 'Division III',
    'mid-major': 'Mid-Major Conferences',
    'power-conferences': 'Power Conferences',
  }

  const sportName = sportNames[sport as keyof typeof sportNames] || sport
  const divisionName = divisionNames[division as keyof typeof divisionNames] || division

  return {
    title: `Your ${divisionName} Top 25 Vote is In!`,
  }
}

export const metadata: Metadata = {
  title: `Vote Confirmation | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: 'Thank you for voting for the top 25 college football teams.',
  robots: {
    follow: false,
    index: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default async function VoteConfirmationPage({
  params,
}: PageProps<'/vote/college/[sport]/[division]/confirmation'>) {
  const { sport, division } = await params
  const header = generateConfirmationHeader(sport, division)
  const user = await auth()

  if (!user.userId) {
    redirect('/')
  }

  const [votingWeek, { year }, sportId] = await Promise.all([
    getCurrentWeek(sport as SportParam),
    getCurrentSeason(sport as SportParam),
    getSportIdBySlug(sport as SportParam),
  ])

  const ballot = await getVoterBallots({
    year,
    week: votingWeek,
    division,
    sportId: sportId || '',
  })

  if (user.userId && !ballot.length) {
    redirect(`/vote/college/${sport}/${division}`)
  }

  const schools = await client.fetch(schoolsByIdQuery, {
    ids: transformBallotToTeamIds(ballot),
  })

  return (
    <div className="container flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">{header?.title}</h1>
        <p className="text-muted-foreground">
          Thank you for casting your vote. Your rankings have been successfully submitted.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {schools.map((school, index) => (
          <div className="flex flex-col items-center gap-2" key={school._id}>
            <div className="flex h-16 w-16 flex-col justify-center">
              <CustomImage image={school.image} width={60} height={60} />
            </div>
            <p className="text-center font-semibold">
              {index + 1}. {school.shortName ?? school.abbreviation ?? school.name}
            </p>
          </div>
        ))}
      </div>
      <div>
        <Link href="/" className={buttonVariants()}>
          Return Home
        </Link>
      </div>
    </div>
  )
}
