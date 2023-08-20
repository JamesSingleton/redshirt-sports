import Link from 'next/link'

import { getDivisions } from '@lib/sanity.fetch'
import { MobileNav } from './MobileNav'
import { MainNav } from './MainNav'
import { ModeToggle } from './ModeToggle'
import LargeLogo from './LargeLogo'
import SearchBar from './SearchBar'

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
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <SearchBar />
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
