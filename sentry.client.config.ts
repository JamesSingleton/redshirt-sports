import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: process.env.NODE_ENV === 'production' ? SENTRY_DSN : undefined,
  tracesSampleRate: 0.25,
  ignoreErrors: [
    /AboutError/,
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.',
  ],
  enabled: !/ByteSpider/.test(navigator.userAgent),
})
