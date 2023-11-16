import Link from 'next/link'
import { Search } from 'lucide-react'

import { getDivisions } from '@lib/sanity.fetch'
import { MobileNav } from './MobileNav'
import { MainNav } from './MainNav'
import { ModeToggle } from './ModeToggle'
import LargeLogo from './LargeLogo'
import { Input } from '@components/ui'

export async function SiteHeader() {
  const divisions = await getDivisions()

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav divisions={divisions} />
        <MobileNav divisions={divisions} />
        <Link href="/" className="ml-4 hidden md:block lg:hidden">
          <LargeLogo className="h-10 w-auto" />
          <span className="sr-only">Redshirt Sports</span>
        </Link>
        <div className="flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end">
          <div className="w-full flex-1 md:w-auto">
            <form
              className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end"
              action="/search"
              role="search"
            >
              <div className="w-full max-w-lg lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative text-muted-foreground">
                  <Input
                    id="search"
                    name="q"
                    placeholder="Search Redshirt Sports..."
                    type="search"
                  />
                </div>
              </div>
            </form>
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
