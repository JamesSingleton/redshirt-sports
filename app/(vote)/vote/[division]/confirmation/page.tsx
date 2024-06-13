import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/server/db'
import { ballots } from '@/server/db/schema'
import { getUsersVote } from '@/server/queries'

export default async function VoteConfirmationPage({ params }: { params: { division: string } }) {
  const { division } = params
  const vote = await getUsersVote()

  console.log(vote)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Thank You for Voting</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your Top 25 college football teams have been submitted.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">1. Alabama</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">2. Ohio State</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">3. Georgia</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">4. Clemson</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">5. Michigan</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">6. USC</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">7. Penn State</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">8. Oklahoma</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">9. Tennessee</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">10. Oregon</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">11. Miami</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">12. Florida State</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">13. Texas</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">14. Utah</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">15. Notre Dame</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">16. UCLA</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">17. Ole Miss</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">18. North Carolina</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">19. Baylor</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">20. Kansas State</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">21. Texas A&M</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">22. Oklahoma State</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">23. Florida</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">24. Mississippi State</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <img
            src="/placeholder.svg"
            width="60"
            height="60"
            alt="Team Logo"
            className="rounded-full"
          />
          <p className="text-sm font-medium">25. Arkansas</p>
        </div>
      </div>
    </div>
  )
}
