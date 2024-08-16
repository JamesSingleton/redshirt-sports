import { UserButton } from '@clerk/nextjs'

import { ModeToggle } from '@/components/mode-toggle'
import { Toaster } from '@/components/ui/sonner'

export default function VoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
        <div className="flex items-center gap-4 text-lg font-semibold">{`${process.env.NEXT_PUBLIC_APP_NAME} Top 25`}</div>
        <div className="flex items-center justify-center gap-4">
          <ModeToggle />
          <UserButton />
        </div>
      </header>
      <main className="flex-1 md:p-10">{children}</main>
      <Toaster />
    </div>
  )
}
