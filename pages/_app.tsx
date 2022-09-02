import '@styles/main.css'

import PlausibleProvider from 'next-plausible'

import { Head } from '@components/common'

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <Head />
      <Component {...pageProps} />
    </PlausibleProvider>
  )
}
