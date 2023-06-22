import Link from 'next/link'

import { getCategories } from '@lib/sanity.client'
import { cn } from '@lib/utils'
import { buttonVariants } from '@components/ui/Button'
import { MobileNav } from './MobileNav'
import { MainNav } from './MainNav'
import { CommandMenu } from './CommandMenu'
import { ModeToggle } from './ModeToggle'
import { Twitter } from './icons'

export async function SiteHeader() {
  const categories = await getCategories()

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav categories={categories} />
        <MobileNav categories={categories} />
        <div className="flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu categories={categories} />
          </div>
          <nav className="flex items-center space-x-1">
            <Link href="https://twitter.com/_redshirtsports" target="_blank" rel="noreferrer">
              <div
                className={cn(
                  buttonVariants({
                    size: 'sm',
                    variant: 'ghost',
                  }),
                  'w-9 px-0'
                )}
              >
                <Twitter className="h-5 w-5 fill-current" />
                <span className="sr-only">Twitter</span>
              </div>
            </Link>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
