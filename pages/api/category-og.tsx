import { ImageResponse } from '@vercel/og'

import type { NextRequest, NextResponse } from 'next/server'
import type { PageConfig } from 'next/types'

export const config: PageConfig = { runtime: 'experimental-edge' }

export default async function og(req: NextRequest, res: NextResponse) {
  const font = fetch(new URL('public/fonts/IndustryInc-Base.ttf', import.meta.url)).then((res) =>
    res.arrayBuffer()
  )
  const { searchParams } = new URL(req.url)

  const title = searchParams.get('title')
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          letterSpacing: '-.02em',
          fontWeight: 700,
          backgroundColor: 'white',
          backgroundImage:
            'radial-gradient(circle at 25px 25px, #F1A7A7 2%, transparent 0%), radial-gradient(circle at 75px 75px, lightgray 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            left: 42,
            top: 42,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              background: '#DC2727',
            }}
          />
          <span
            style={{
              marginLeft: 8,
              fontSize: 20,
              top: 3,
            }}
          >
            redshirtsports.xyz
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '20px 50px',
            margin: '0 42px',
            fontSize: 40,
            width: 'auto',
            maxWidth: 550,
            textAlign: 'center',
            backgroundColor: '#DC2727',
            color: 'white',
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'IndustryInc',
          data: await font,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
