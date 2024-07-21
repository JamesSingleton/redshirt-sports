import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/vote(.*)'])

export default clerkMiddleware((auth, req: NextRequest) => {
  if (isProtectedRoute(req)) auth().protect()

  // const { userId, sessionClaims } = auth()

  // if (userId && req.nextUrl.pathname === '/vote/onboarding') {
  //   return NextResponse.next()
  // }

  // if (userId && !sessionClaims?.metadata.onboardingComplete) {
  //   const onboardingUrl = new URL('/vote/onboarding', req.url)
  //   return NextResponse.redirect(onboardingUrl)
  // }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
