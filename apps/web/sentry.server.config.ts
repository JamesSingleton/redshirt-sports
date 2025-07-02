import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://0345d0cacda34590b6139082a4521911@o1192929.ingest.us.sentry.io/6314703',
  tracesSampleRate: 1,
  debug: false,
  maxValueLength: 500,
})
