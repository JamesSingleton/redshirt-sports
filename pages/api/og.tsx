import { ImageResponse } from '@vercel/og'
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '@lib/sanity.api'
import { height, width, OpenGraphImage } from '@components/common/OpenGraphImage'

import type { NextRequest, NextResponse } from 'next/server'
import type { PageConfig } from 'next/types'

export const config: PageConfig = { runtime: 'experimental-edge' }

export default async function og(req: NextRequest, res: NextResponse) {
  const font = fetch(new URL('public/fonts/IndustryInc-Base.ttf', import.meta.url)).then((res) =>
    res.arrayBuffer()
  )

  const { searchParams } = new URL(req.url)

  let title = searchParams.get('title')

  if (!title) {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
    })
    const settings = (await client.fetch<Settings>(settingsQuery)) || {}
    title = settings?.ogImage?.title
  }

  return new ImageResponse(<OpenGraphImage title={title || 'Redshirt Sports'} />, {
    width,
    height,
    fonts: [
      {
        name: 'IndustryInc',
        data: await font,
        style: 'normal',
        weight: 700,
      },
    ],
  })
}
