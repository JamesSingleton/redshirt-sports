import type { Season } from '@/types'

export async function getCurrentSeason(): Promise<Season> {
  const currentSeason = await fetch(
    'https://site.api.espn.com/apis/common/v3/sports/football/college-football/season',
  ).then((res) => res.json())

  return currentSeason
}
