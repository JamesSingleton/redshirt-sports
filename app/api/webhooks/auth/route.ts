import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { Webhook } from 'svix'
import { eq } from 'drizzle-orm'

import { db } from '@/server/db'
import { usersTable } from '@/server/db/schema'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const { type, data } = evt

  try {
    switch (type) {
      case 'user.created':
        await db.insert(usersTable).values({
          // @ts-ignore
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
        })
        break
      case 'user.updated':
        await db
          .update(usersTable)
          .set({
            firstName: data.first_name as string,
            lastName: data.last_name as string,
            organization: data.public_metadata.organization as string,
            organizationRole: data.public_metadata.organizationRole as string,
            isAdmin: data.public_metadata.isAdmin as boolean,
            isVoter: data.public_metadata.isVoter as boolean,
          })
          .where(eq(usersTable.id, data.id))
        break
      default:
        return new Response('', { status: 501 })
    }
    return new Response('', { status: 200 })
  } catch (error: any) {
    return new Response(error?.message, { status: 500 })
  }
}
