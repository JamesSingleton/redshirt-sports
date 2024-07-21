import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'

import { ModeToggle } from '@/components/common/ModeToggle'

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  console.log('Session Claims', auth().sessionClaims?.metadata.onboardingComplete)
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-4 text-lg font-semibold">Redshirt Sports Top 25</div>
        <div className="flex items-center justify-center gap-4">
          <ModeToggle />
          <UserButton />
        </div>
      </header>
      <main className="flex-1 md:p-10">{children}</main>
    </div>
  )
}
