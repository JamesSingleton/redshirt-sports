/* eslint-disable @next/next/no-img-element */
// /pages/api/og.tsx

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const config = {
  runtime: 'experimental-edge',
}

function arrayBufferToBase64(buffer: any) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const hasTitle = searchParams.has('title')
    const title = hasTitle ? searchParams.get('title')?.slice(0, 100) : 'Redshirt Sports'

    const imageData = await fetch(
      new URL('../../public/images/icons/RS_red.svg', import.meta.url)
    ).then((res) => res.arrayBuffer())

    const image = arrayBufferToBase64(imageData)

    const fontData = await fetch(
      new URL('../../public/fonts/IndustryInc-Base.ttf', import.meta.url)
    ).then((res) => res.arrayBuffer())

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: 'black',
            backgroundSize: '150px 150px',
            height: '100%',
            width: '100%',
            display: 'flex',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexWrap: 'nowrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              alignContent: 'center',
              justifyContent: 'center',
              justifyItems: 'center',
            }}
          >
            <img
              alt="Redshirt Sports Logo"
              height={512}
              src={`data:image/svg+xml;base64,${image}`}
              style={{ margin: '0 30px' }}
              width={512}
            />
          </div>
          <div
            style={{
              // When the title is very short we increase the font size.
              // We choose 14 here because that'll be the maximum width to keep it
              // one line (14 “W” characters).
              fontSize: title!.length < 14 ? 72 : 60,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              color: '#DC2727',
              marginTop: 30,
              padding: '0 120px',
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
            }}
          >
            {title}
          </div>
        </div>
      ),
      {
        fonts: [
          {
            name: 'IndustryInc-Base',
            data: fontData,
            weight: 500,
            style: 'normal',
          },
        ],
      }
    )
  } catch (e: any) {
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    })
  }
}
