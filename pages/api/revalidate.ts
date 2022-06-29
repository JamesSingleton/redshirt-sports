import { isValidRequest } from '@sanity/webhook'
import { withSentry } from '@sentry/nextjs'

import type { NextApiRequest, NextApiResponse } from 'next'

const secret = process.env.SANITY_WEBHOOK_SECRET

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    console.error('Only POST requests are accepted')
    return res.status(401).json({ message: 'Only POST requests are accepted' })
  }

  if (!isValidRequest(req, secret!)) {
    res.status(401).json({ message: 'Invalid signature' })
  }

  try {
    const {
      body: { type, slug },
    } = req

    switch (type) {
      case 'post':
        await res.revalidate(`/${slug}`)
        await res.revalidate('/')
        return res.json({ message: `Revalidated "${type}" with slug "${slug}"` })
    }

    return res.json({ message: 'No managed type' })
  } catch (err) {
    return res.status(500).send({ message: 'Error revalidating' })
  }
}

export default withSentry(handler)
