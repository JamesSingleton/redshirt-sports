import { NextApiRequest, NextApiResponse } from 'next'

import { sanityClient } from '@lib/sanity.server'
import { searchQuery } from '@lib/queries'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const posts = await sanityClient.fetch(searchQuery, {
    searchTerm: req.query.searchTerm,
  })

  res.status(200).json({ message: posts })
}
