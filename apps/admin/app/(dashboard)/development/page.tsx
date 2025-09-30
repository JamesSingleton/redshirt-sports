'use client'
import { Button } from '@redshirt-sports/ui/components/button'
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardTitle,
} from '@redshirt-sports/ui/components/card'

import {
  fetchAndLoadAllSeasons,
  fetchAndLoadConferences,
  fetchAndLoadDivisions,
  fetchAndLoadSchools,
  fetchAndLoadSports,
  fetchAndLoadSubdivisions,
  fetchAndTransformRankings,
} from '@/actions/data-loaders'

import { useActionState } from 'react'

interface LoaderActionProps {
  loader: (formData: FormData) => Promise<any>
}

function LoaderAction({ loader }: LoaderActionProps) {
  const [state, runAction, isPending] = useActionState(
    async (_prevState: { success: boolean; error: string | null }, formData: FormData) => {
      try {
        await loader(formData)
        return { success: true, error: null }
      } catch (error: any) {
        return { success: false, error: error?.message || 'Unknown error' }
      }
    },
    { success: false, error: null },
  )

  return (
    <form action={runAction} className="w-full">
      <Button type="submit" disabled={isPending}>
        Run
      </Button>
      {isPending && <span className="text-sm ml-2">Loading...</span>}
      {state.error && <span className="block text-sm mt-2 text-destructive">{state.error}</span>}
      {state.success && !state.error && (
        <span className="block text-sm text-green-600 mt-2">Success!</span>
      )}
    </form>
  )
}

const configuredLoaders = [
  {
    label: 'Sports',
    description:
      'This loader will pull sports from Sanity and load them. It should be the first loader run on a fresh db.',
    loader: fetchAndLoadSports,
  },
  {
    label: 'Seasons, Season Types, and Weeks',
    description:
      'This loader will fetch season info along with season types and weeks for the three sports currently supported (football, mens basketball, and womens basketball) and insert it into the db. Season info going back to 2023 will be loaded.',
    loader: fetchAndLoadAllSeasons,
  },
  {
    label: 'Divisions',
    description:
      'This loader will fetch and load division info (D1, D2, NAIA, etc). It should be run before conferences or subdivisions.',
    loader: fetchAndLoadDivisions,
  },
  {
    label: 'Conferences',
    description:
      'This loader will fetch and load conference info (MVFC, UAC, etc). This should be run before schools in order for school conference affiliations to be created.',
    loader: fetchAndLoadConferences,
  },
  {
    label: 'Subdivisions',
    description:
      'This loader will fetch subdivisions (FCS, FBS, etc) for the sports that support it. It should run before schools.',
    loader: fetchAndLoadSubdivisions,
  },
  {
    label: 'Schools',
    description: 'This loader will fetch and load school info.',
    loader: fetchAndLoadSchools,
  },
  {
    label: 'Rankings',
    loader: fetchAndTransformRankings,
  },
]

export default function Development() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Data Loaders</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configuredLoaders.map((loaderConfig) => (
          <Card key={loaderConfig.label}>
            <CardHeader>
              <CardTitle>{loaderConfig.label}</CardTitle>
              <CardDescription>{loaderConfig.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <LoaderAction loader={loaderConfig.loader} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
