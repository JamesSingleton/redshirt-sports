import { MobileNav } from './MobileNav'
import { MainNav } from './MainNav'
import { CommandMenu } from './CommandMenu'
import { getCategories } from '@lib/sanity.client'

export async function SiteHeader() {
  const categories = await getCategories()
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav categories={categories} />
        <MobileNav categories={categories} />
        <div className="flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>
          <nav className="flex items-center space-x-1"></nav>
        </div>
      </div>
    </header>
  )
}
