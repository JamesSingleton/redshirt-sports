import '@styles/main.css'
import { FC, useEffect } from 'react'
import type { AppProps } from 'next/app'
import PlausibleProvider from 'next-plausible'
import { Head } from '@components/common'

const Noop: FC = ({ children }) => <>{children}</>

export default function MyApp({ Component, pageProps }: AppProps) {
  const Layout = (Component as any).Layout || Noop

  const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID

  useEffect(() => {
    document.body.classList?.remove('loading')
  }, [])

  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <Head />
      <Layout pageProps={pageProps}>
        <Component {...pageProps} />
      </Layout>
    </PlausibleProvider>
  )
}
