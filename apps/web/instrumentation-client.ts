import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

Sentry.init({
  dsn: 'https://0345d0cacda34590b6139082a4521911@o1192929.ingest.us.sentry.io/6314703',
  tracesSampleRate: 1,
  debug: false,
  maxValueLength: 500,
  sendDefaultPii: true,
})

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: '/ingest',
  ui_host: 'https://us.posthog.com',
  defaults: '2026-01-30',
  // Enable capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: process.env.NODE_ENV === 'development',
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
