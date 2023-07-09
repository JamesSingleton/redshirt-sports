import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { SIGNATURE_HEADER_NAME, isValidSignature } from '@sanity/webhook'

const secret = `${process.env.SANITY_WEBHOOK_SECRET}`

export async function POST(request: NextRequest) {
  const res = await request.json()

  const headersList = headers()

  const signature = `${headersList.get(SIGNATURE_HEADER_NAME)}`
  const isValid = isValidSignature(JSON.stringify(res), signature, secret)

  console.log(`===== Is the webhook request valid? ${isValid}`)

  if (!isValid) {
    NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 })
    return
  }

  const { type, slug, authorSlug, parentCategory, subcategory } = res

  const postPathToRevalidate = `/${slug}`
  const authorPathToRevalidate = `/authors/${authorSlug}`
  const categoryPathToRevalidate = `/news/${parentCategory}`
  const subcategoryPathToRevalidate = `/news/${parentCategory}/${subcategory}`

  revalidatePath(postPathToRevalidate)
  revalidatePath(authorPathToRevalidate)
  revalidatePath(categoryPathToRevalidate)
  revalidatePath(subcategoryPathToRevalidate)
  revalidatePath('/')

  console.log(`===== Revalidated path: ${postPathToRevalidate}`)
  console.log(`===== Revalidated path: ${authorPathToRevalidate}`)
  console.log(`===== Revalidated path: ${categoryPathToRevalidate}`)
  console.log(`===== Revalidated path: ${subcategoryPathToRevalidate}`)

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
