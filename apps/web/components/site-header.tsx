import { getDivisions } from '@/lib/sanity.fetch'
import { MobileNav } from '@/components/mobile-nav'
import { MainNav } from '@/components/main-nav'
import { ModeToggle } from '@/components/mode-toggle'
import { Input } from '@/components/ui/input'
import { getLatestFinalRankings } from '@/server/queries'

export async function SiteHeader() {
  const divisions = await getDivisions()
  const latestFCSTop25 = await getLatestFinalRankings({
    division: 'fcs',
  })

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav divisions={divisions} latestFCSTop25={latestFCSTop25} />
        <MobileNav divisions={divisions} latestFCSTop25={latestFCSTop25} />
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
                    placeholder={`Search ${process.env.NEXT_PUBLIC_APP_NAME}...`}
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
