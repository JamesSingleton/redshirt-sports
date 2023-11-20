import Link from 'next/link'

import { SmallLogo, ThemeProvider } from '@components/common'
import { ModeToggle } from '@components/common/ModeToggle'
import { Button } from '@components/ui'
import SideNav from './SideNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen w-screen flex-col bg-background">
        <nav className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center space-x-4">
            <SmallLogo className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Redshirt Sports Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <ModeToggle />
            <Button size="icon" variant="ghost">
              <svg
                className=" h-5 w-5"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="sr-only">View notifications</span>
            </Button>
          </div>
        </nav>
        <div className="flex flex-1 overflow-hidden">
          <SideNav />
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
        <footer className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <p className="text-sm text-muted-foreground">© 2023 Redshirt Sports</p>
          <nav className="flex items-center space-x-4">
            <Link className="text-sm text-muted-foreground" href="#">
              Terms
            </Link>
            <Link className="text-sm text-muted-foreground" href="#">
              Privacy
            </Link>
          </nav>
        </footer>
      </div>
    </ThemeProvider>
  )
}
