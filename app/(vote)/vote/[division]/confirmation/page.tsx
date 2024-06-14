import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

import { getUsersVote } from '@/server/queries'
import { getSchoolsById } from '@/lib/sanity.fetch'
import { ImageComponent } from '@/components/common'
import { buttonVariants } from '@/components/ui/button'
import { SchoolLite } from '@/types'

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

export default async function VoteConfirmationPage({ params }: { params: { division: string } }) {
  const { division } = params
  const header = voteConfirmationHeaderByDivision.find((d) => d.division === division)
  const user = auth()
  const vote = await getUsersVote()

  if (!user.userId) {
    redirect('/')
  }

  if (user.userId && !vote) {
    redirect(`/vote/${division}`)
  }

  const teamIds = Object.keys(vote as any).reduce((acc, key) => {
    if (key.startsWith('rank_')) {
      // @ts-expect-error
      acc.push(vote[key])
    }
    return acc
  }, [])

  const schools = await getSchoolsById(teamIds)

  // order the schools in the order they were voted on
  const orderedSchools = teamIds.map((id) =>
    schools.find((school) => school._id === id),
  ) as SchoolLite[]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">{header?.title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{header?.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        {orderedSchools.map((school, index) => (
          <div className="flex flex-col items-center gap-2" key={school._id}>
            <div className="flex h-16 w-16 flex-col justify-center">
              <ImageComponent image={school.image} width={60} height={60} mode="contain" />
            </div>
            <p className="text-center text-sm font-medium">
              {index + 1}. {school.name}
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
