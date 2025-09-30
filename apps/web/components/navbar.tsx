import { memo } from 'react'

import { globalNavigationQuery, queryGlobalSeoSettings } from '@/lib/sanity/query'
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from '@/lib/sanity/sanity.types'
import { getLatestFinalRankingsBySportSlug } from '@redshirt-sports/db/queries'
import { client } from '@/lib/sanity/client'
import { Logo } from './logo'
import { NavbarClient, NavbarSkeletonResponsive } from './navbar-client'

export interface RankingPeriod {
  division: string
  week: number
  year: number
}

export type RankingPeriodOrUndefined = RankingPeriod | undefined

export interface SportRankings {
  sport: string
  divisions: RankingPeriodOrUndefined[]
}

export type Top25RankingsData = SportRankings[]

export async function NavbarServer() {
  const [navbarData, settingsData, latestFootballRankings, latestMensBasketballRankings] =
    await Promise.all([
      client.fetch(
        globalNavigationQuery,
        {},
        {
          cache: 'force-cache',
          next: {
            revalidate: 604800,
          },
        },
      ),
      client.fetch(
        queryGlobalSeoSettings,
        {},
        {
          cache: 'force-cache',
          next: {
            revalidate: 604800,
          },
        },
      ),
      getLatestFinalRankingsBySportSlug('football'),
      getLatestFinalRankingsBySportSlug('mens-basketball'),
    ])

  const latestRankings: Top25RankingsData = [
    {
      sport: 'football',
      divisions: latestFootballRankings,
    },
    {
      sport: 'mens-basketball',
      divisions: latestMensBasketballRankings,
    },
  ]

  return (
    <MemoizedNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankings={latestRankings}
    />
  )
}

// Memoize the main Navbar component to prevent unnecessary re-renders
const MemoizedNavbar = memo(function Navbar({
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
            latestRankings={latestRankings || []}
          />
        </div>
      </div>
    </header>
  )
})

export { MemoizedNavbar as Navbar }

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
