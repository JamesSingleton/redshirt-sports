import * as Sentry from '@sentry/nextjs'
import { fetchAndLoadSports } from '@/utils/loaders'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await fetchAndLoadSports()
  } catch (e) {
    Sentry.captureException(e)

    return NextResponse.json(
      {
        error: e,
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ result: 'ok' })
}
