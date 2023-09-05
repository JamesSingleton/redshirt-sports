import { revalidateSecret } from 'lib/sanity.api'
import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string
      slug?: string | undefined
      division?:
        | {
            _type: string
            slug: string
          }
        | undefined
      conferences?:
        | {
            _type: string
            slug: string
          }[]
        | undefined
      author?:
        | {
            _type: string
            _id: string
            slug: string
          }
        | undefined
    }>(req, revalidateSecret)
    if (!isValidSignature) {
      const message = 'Invalid signature'
      return new Response(message, { status: 401 })
    }

    if (!body?._type) {
      return new Response('Bad Request', { status: 400 })
    }

    revalidateTag(body._type)
    if (body.slug) {
      revalidateTag(`${body._type}:${body.slug}`)
    }
    if (body.division) {
      revalidateTag(`${body.division._type}:${body.division.slug}`)
    }
    if (body.conferences) {
      body.conferences.forEach((conference) => {
        revalidateTag(`${conference._type}:${conference.slug}`)
      })
    }
    if (body.author) {
      revalidateTag(`${body.author._type}:${body.author.slug}`)
      revalidateTag(`${body.author._type}:${body.author._id}`)
    }
    return NextResponse.json({
      status: 200,
      revalidated: true,
      now: Date.now(),
      body,
    })
  } catch (err: any) {
    console.error(err)
    return new Response(err.message, { status: 500 })
  }
}
