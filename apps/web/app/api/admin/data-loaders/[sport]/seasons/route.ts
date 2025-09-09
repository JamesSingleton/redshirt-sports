import { SportParam } from '@/utils/espn'
import { fetchAndLoadSeasons } from '@/utils/loaders'
import { NextResponse } from 'next/server'

const validSports = ['football', 'mens-basketball', 'womens-basketball']

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sport: SportParam }> },
) {
  const { sport: sportSlug } = await params
  if (!validSports.includes(sportSlug)) {
    return NextResponse.json(
      {
        error: 'Invalid sport',
      },
      { status: 400 },
    )
  }
  try {
    await fetchAndLoadSeasons(sportSlug)
  } catch (e) {
    console.log(e)
    return NextResponse.json(
      {
        error: e,
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ result: 'ok' })
}
