import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

type UserMetadata = {
  isVoter?: boolean
}

const isOnboardingRoute = createRouteMatcher(['/vote/onboarding'])
const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/vote(.*)'])

export default clerkMiddleware((auth, req: NextRequest) => {
  const { userId, sessionClaims, redirectToSignIn } = auth()
  if (isProtectedRoute(req)) {
    auth().protect()
    const { isVoter } = sessionClaims?.metadata as UserMetadata
    if (!isVoter) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  if (userId && isOnboardingRoute(req)) {
    return NextResponse.next()
  }

  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  if (userId && !sessionClaims?.metadata?.onboardingComplete) {
    const onboardingUrl = new URL('/vote/onboarding', req.url)
    return NextResponse.redirect(onboardingUrl)
  }

  if (userId && isProtectedRoute(req)) {
    return NextResponse.next()
  }
})

export const config = {
  // matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
