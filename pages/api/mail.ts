import sendgrid from '@sendgrid/mail'

import type { NextApiRequest, NextApiResponse } from 'next'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY!)

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = JSON.parse(req.body)

  const message = `
    Name: ${body.name}\r\n

  `
}
