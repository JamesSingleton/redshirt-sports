/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from '@vercel/og'
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '@lib/sanity.api'
import { urlForImage } from '@lib/sanity.image'

import type { NextRequest, NextResponse } from 'next/server'
import type { PageConfig } from 'next/types'

export const config: PageConfig = { runtime: 'experimental-edge' }

export default async function og(req: NextRequest, res: NextResponse) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
  })
  const data = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0]{
      title,
      "author": author->name,
      "mainImage": {
        "caption": mainImage.caption,
        "attribution": mainImage.attribution,
        "crop": mainImage.crop,
        "hotspot": mainImage.hotspot,
        "asset": mainImage.asset->{
          _id,
          _type,
          url,
          metadata
        }
      }
    }`,
    { slug }
  )
  const { author, mainImage, title } = data
  return new ImageResponse(
    (
      <div tw="h-full w-full flex items-start justify-start">
        <div tw="flex items-start justify-start h-full">
          <div tw="flex w-2/5 flex-col justify-between h-full pl-4 py-4 bg-gray-50">
            <div tw="flex flex-col">
              <p tw="text-xl font-bold mb-0 text-red-500">redshirtsports.xyz</p>
              <h1 tw="text-3xl font-black text-left">{title}</h1>
            </div>
            <p tw="text-2xl font-bold">{`By ${author}`}</p>
          </div>
          <div tw="flex w-3/5 h-full">
            <img
              tw="w-full h-full"
              style={{ objectFit: 'cover' }}
              src={urlForImage(mainImage).url()}
              alt={mainImage.caption}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
