import NextErrorComponent, { ErrorProps as NextErrorProps } from 'next/error'
import { NextPageContext } from 'next'
import * as Sentry from '@sentry/nextjs'

export type ErrorPageProps = {
  err: Error
  statusCode: number
  hasGetInitialPropsRun: boolean
  children?: React.ReactElement
}

export type ErrorProps = {
  hasGetInitialPropsRun: boolean
} & NextErrorProps

const ErrorPage = ({
  statusCode,
  hasGetInitialPropsRun,
  err,
}: ErrorPageProps) => {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592. As a workaround, we pass
    // err via _app.js so it can be captured
    Sentry.captureException(err)
    // Flushing is not required in this case as it only happens on the client
  }

  return <NextErrorComponent statusCode={statusCode} />
}

ErrorPage.getInitialProps = async (
  props: NextPageContext
): Promise<ErrorProps> => {
  const { res, err, asPath } = props
  const errorInitialProps: ErrorProps =
    (await NextErrorComponent.getInitialProps({
      res,
      err,
    } as NextPageContext)) as ErrorProps

  errorInitialProps.hasGetInitialPropsRun = true

  if (res?.statusCode === 404) {
    return errorInitialProps
  }

  if (err) {
    Sentry.captureException(err)
    await Sentry.flush(2000)
    return errorInitialProps
  }

  Sentry.captureException(
    new Error(`_error.tsx getInitialProps missing data at path: ${asPath}`)
  )

  await Sentry.flush(2000)

  return errorInitialProps
}

export default ErrorPage
