import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: process.env.NODE_ENV === 'production' ? SENTRY_DSN : null,
  tracesSampleRate: 0.5,
})
