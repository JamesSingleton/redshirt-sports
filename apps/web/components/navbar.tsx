import { sanityFetch } from '@/lib/sanity/live'
import { globalNavigationQuery, queryGlobalSeoSettings } from '@/lib/sanity/query'
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from '@/lib/sanity/sanity.types'

import { Logo } from './logo'
import { NavbarClient, NavbarSkeletonResponsive } from './navbar-client'
import { getLatestFinalRankings } from '@/server/queries'

export interface RankingPeriod {
  division: string
  week: number
  year: number
}

export interface SportRankings {
  [sportName: string]: RankingPeriod[] | undefined
}

export type Top25RankingsData = SportRankings[]

export async function NavbarServer() {
  const [navbarData, settingsData, latestFCSTop25] = await Promise.all([
    sanityFetch({ query: globalNavigationQuery }),
    sanityFetch({ query: queryGlobalSeoSettings }),
    getLatestFinalRankings({ division: 'fcs' }),
  ])

  const latestRankings: Top25RankingsData = [
    {
      football: latestFCSTop25 ? [latestFCSTop25] : [],
    },
  ]

  return (
    <Navbar
      navbarData={navbarData.data}
      settingsData={settingsData.data}
      latestRankings={latestRankings}
    />
  )
}

export function Navbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: GlobalNavigationQueryResult
  settingsData: QueryGlobalSeoSettingsResult
  latestRankings: Top25RankingsData | undefined
}) {
  const { siteTitle: settingsSiteTitle, logo } = settingsData ?? {}

  return (
    <header className="py-3 md:border-b">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-[auto_1fr] items-center gap-4">
          {logo && <Logo alt={settingsSiteTitle} priority image={logo} />}
          <NavbarClient
            navbarData={navbarData}
            settingsData={settingsData}
            latestRankings={latestRankings}
          />
        </div>
      </div>
    </header>
  )
}

export function NavbarSkeleton() {
  return (
    <header className="h-[65px] py-4 md:border-b">
      <div className="container mx-auto px-4 md:px-6">
        <nav className="grid grid-cols-[auto_1fr] items-center gap-4">
          <div className="bg-muted h-[40px] w-[170px] animate-pulse rounded" />
          <NavbarSkeletonResponsive />
        </nav>
      </div>
    </header>
  )
}
