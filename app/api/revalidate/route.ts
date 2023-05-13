import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { SIGNATURE_HEADER_NAME, isValidSignature } from '@sanity/webhook'

const secret = process.env.SANITY_WEBHOOK_SECRET as string

async function readBody(readable: any) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get(SIGNATURE_HEADER_NAME) as string

  const body = await readBody(request)

  if (!isValidSignature(body, signature, secret)) {
    return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 })
  }

  try {
    const jsonBody = JSON.parse(body)
    const { type, slug, authorSlug, category } = jsonBody

    if (type === 'post') {
      revalidatePath(`/${slug}`)
      revalidatePath(`/authors/${authorSlug}`)
      revalidatePath('/')

      return NextResponse.json({ revalidated: true, now: Date.now() })
    }
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Error revalidating' }, { status: 500 })
  }
}
