import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

type UserMetadata = {
  isVoter?: boolean
  isAdmin?: boolean
}

const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/vote(.*)'])

export default clerkMiddleware((auth, req: NextRequest) => {
  const { userId, sessionClaims, redirectToSignIn } = auth()
  if (isProtectedRoute(req)) {
    auth().protect()
    const { isVoter, isAdmin } = sessionClaims?.metadata as UserMetadata

    if (!isAdmin && req.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.error()
    }

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
    const onboardingUrl = new URL('/onboarding', req.url)
    return NextResponse.redirect(onboardingUrl)
  }

  if (userId && isProtectedRoute(req)) {
    return NextResponse.next()
  }
})

export const config = {
  matcher: ['/admin/:path*', '/vote/:path*', '/onboarding/:path*', '/api/vote'],
}
