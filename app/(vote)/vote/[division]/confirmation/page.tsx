import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

import { getVoterBallots } from '@/server/queries'
import { getSchoolsById } from '@/lib/sanity.fetch'
import { ImageComponent } from '@/components/common'
import { buttonVariants } from '@/components/ui/button'

import { type Ballot } from '@/types'

const voteConfirmationHeaderByDivision = [
  {
    division: 'fbs',
    title: 'Thank You for Voting for the Top 25 Football Bowl Subdivision (FBS) Teams',
    subtitle: 'Your FBS Top 25 college football teams have been submitted.',
  },
  {
    division: 'fcs',
    title: 'Thank You for Voting for the Top 25 Football Championship Subdivision (FCS) Teams',
    subtitle: 'Your FCS Top 25 college football teams have been submitted.',
  },
  {
    division: 'd2',
    title: 'Thank You for Voting for the Top 25 Division II Teams',
    subtitle: 'Your Division II Top 25 college football teams have been submitted.',
  },
  {
    division: 'd3',
    title: 'Thank You for Voting for the Top 25 Division III Teams',
    subtitle: 'Your Division III Top 25 college football teams have been submitted.',
  },
]

const transformBallotToTeamIds = (ballot: Ballot[]) => {
  return ballot.map((b: Ballot) => ({ id: b.teamId, rank: b.rank }))
}

export default async function VoteConfirmationPage({ params }: { params: { division: string } }) {
  const { division } = params
  const header = voteConfirmationHeaderByDivision.find((d) => d.division === division)
  const user = auth()
  const year = new Date().getFullYear()
  const ballot = (await getVoterBallots({
    year,
    week: 0,
    division,
  })) as Ballot[]

  if (!user.userId) {
    redirect('/')
  }

  if (user.userId && !ballot) {
    redirect(`/vote/${division}`)
  }

  const schools = await getSchoolsById(transformBallotToTeamIds(ballot))

  return (
    <div className="container flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">{header?.title}</h1>
        <p className="text-muted-foreground">{header?.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {schools.map((school, index) => (
          <div className="flex flex-col items-center gap-2" key={school._id}>
            <div className="flex h-16 w-16 flex-col justify-center">
              <ImageComponent image={school.image} width={60} height={60} mode="contain" />
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