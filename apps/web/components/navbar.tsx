import { memo } from 'react'

import { globalNavigationQuery, queryGlobalSeoSettings } from '@redshirt-sports/sanity/queries'
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from '@redshirt-sports/sanity/types'
import { getLatestFinalRankingsBySportSlug } from '@redshirt-sports/db/queries'
import { client } from '@redshirt-sports/sanity/client'
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
      <div className="container">
        <div className="grid grid-cols-[auto_1fr] items-center gap-6 py-2">
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
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="container">
        <nav className="grid grid-cols-[auto_1fr] items-center gap-6 py-2">
          <div className="bg-muted h-[40px] w-[170px] animate-pulse rounded" />
          <NavbarSkeletonResponsive />
        </nav>
      </div>
    </header>
  )
}
