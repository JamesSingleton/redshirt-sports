import '@styles/main.css'

import PlausibleProvider from 'next-plausible'

import { Head, Layout } from '@components/common'

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <Head />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </PlausibleProvider>
  )
}
