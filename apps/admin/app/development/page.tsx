import {
  fetchAndLoadAllSeasons,
  fetchAndLoadConferences,
  fetchAndLoadDivisions,
  fetchAndLoadSchools,
  fetchAndLoadSports,
  fetchAndLoadSubdivisions,
  fetchAndTransformRankings,
} from '@/actions/data-loaders'

const configuredLoaders = [
  {
    label: 'Sports',
    loader: fetchAndLoadSports,
  },
  {
    label: 'Seasons, Season Types, and Weeks (College Football)',
    loader: fetchAndLoadAllSeasons,
  },
  {
    label: 'Conferences',
    loader: fetchAndLoadConferences,
  },
  {
    label: 'Divisions',
    loader: fetchAndLoadDivisions,
  },
  {
    label: 'Subdivisions',
    loader: fetchAndLoadSubdivisions,
  },
  {
    label: 'Schools',
    loader: fetchAndLoadSchools,
  },
  {
    label: 'Rankings',
    loader: fetchAndTransformRankings,
  },
]

export default async function Development() {
  return (
    <div>
      <h2>Data Loaders</h2>
      {configuredLoaders.map((loaderConfig) => {
        return (
          <form action={loaderConfig.loader}>
            <p>{loaderConfig.label}</p>
            <button type="submit">Run</button>
          </form>
        )
      })}
    </div>
  )
}
