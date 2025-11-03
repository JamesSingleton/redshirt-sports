import { NextRequest, NextResponse } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

type UserMetadata = {
  isVoter?: boolean
  isAdmin?: boolean
}

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { sessionClaims } = await auth()
  if (!isPublicRoute(req)) {
    await auth.protect()
    const { isAdmin } = sessionClaims?.metadata as UserMetadata

    if (!isAdmin) {
      return NextResponse.redirect(new URL('https://www.redshirtsports.xyz', req.url))
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
