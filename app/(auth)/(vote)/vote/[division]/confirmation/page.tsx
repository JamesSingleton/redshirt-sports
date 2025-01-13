import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

import { getVoterBallots } from '@/server/queries'
import { getSchoolsById } from '@/lib/sanity.fetch'
import { Image as SanityImage } from '@/components/image'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentWeek } from '@/utils/getCurrentWeek'
import { transformBallotToTeamIds } from '@/utils/process-ballots'

import { type Metadata } from 'next'
import { type Ballot } from '@/types'
import { getCurrentSeason } from '@/utils/getCurrentSeason'

const voteConfirmationHeaderByDivision = [
  {
    division: 'fbs',
    title: 'Your FBS Top 25 Vote is In!',
  },
  {
    division: 'fcs',
    title: 'Your FCS Top 25 Vote is In!',
  },
  {
    division: 'd2',
    title: 'Your Division II Top 25 Vote is In!',
  },
  {
    division: 'd3',
    title: 'Your Division III Top 25 Vote is In!',
  },
]

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

export default async function VoteConfirmationPage({ params }: { params: { division: string } }) {
  const { division } = params
  const header = voteConfirmationHeaderByDivision.find((d) => d.division === division)
  const user = auth()
  const votingWeek = await getCurrentWeek()
  const { year } = await getCurrentSeason()
  const ballot = (await getVoterBallots({
    year,
    week: votingWeek,
    division,
  })) as Ballot[]

  if (!user.userId) {
    redirect('/')
  }

  if (user.userId && !ballot.length) {
    redirect(`/vote/${division}`)
  }

  const schools = await getSchoolsById(transformBallotToTeamIds(ballot))

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
              <SanityImage src={school.image as any} width={60} height={60} />
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
