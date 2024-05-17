import * as Sentry from '@sentry/nextjs'

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: 'https://0345d0cacda34590b6139082a4521911@o1192929.ingest.us.sentry.io/6314703',
      tracesSampleRate: 0.25,
      ignoreErrors: [
        /AboutError/,
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications.',
      ],
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: 'https://0345d0cacda34590b6139082a4521911@o1192929.ingest.us.sentry.io/6314703',
      tracesSampleRate: 0.25,
      ignoreErrors: [
        /AboutError/,
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications.',
      ],
    })
  }
}
