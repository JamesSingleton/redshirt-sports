import Link from 'next/link'
import { Search } from 'lucide-react'

import { getDivisions } from '@lib/sanity.fetch'
import { MobileNav } from './MobileNav'
import { MainNav } from './MainNav'
import { ModeToggle } from './ModeToggle'
import LargeLogo from './LargeLogo'

export async function SiteHeader() {
  const divisions = await getDivisions()

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav categories={divisions} />
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
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="search"
                    name="q"
                    className="placeholder-text-muted-foreground block w-full rounded-md border border-border bg-muted py-2 pl-10 pr-3 leading-5 focus:border-brand-500 focus:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
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
