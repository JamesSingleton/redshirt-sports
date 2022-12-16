import { SIGNATURE_HEADER_NAME, isValidSignature } from '@sanity/webhook'
import * as Sentry from '@sentry/nextjs'

import type { NextApiRequest, NextApiResponse } from 'next'

const secret = process.env.SANITY_WEBHOOK_SECRET as string

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readBody(readable: any) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const signature = req.headers[SIGNATURE_HEADER_NAME] as string
  const body = await readBody(req)
  if (req.method !== 'POST') {
    console.error('Only POST requests are accepted')
    return res.status(401).json({ success: false, message: 'Only POST requests are accepted' })
  }

  if (!isValidSignature(body, signature, secret)) {
    res.status(401).json({ success: false, message: 'Invalid signature' })
    return
  }

  try {
    const jsonBody = JSON.parse(body)
    const { type, slug, authorSlug, category } = jsonBody

    switch (type) {
      case 'post':
        await res.revalidate(`/${slug}`)
        await res.revalidate('/')
        await res.revalidate(`/authors/${authorSlug}`)
        await res.revalidate(`/${category.toLowerCase()}`)
        return res.json({ success: true, message: `Revalidated "${type}" with slug "${slug}"` })
    }

    return res.json({ message: 'No managed type' })
  } catch (err) {
    Sentry.captureException(err)
    return res.status(500).send({ success: false, message: 'Error revalidating' })
  }
}

export default handler
