import '@styles/main.css'

import { cal, inter } from '@styles/fonts'
import PlausibleProvider from 'next-plausible'
import clsx from 'clsx'

import { Head, Layout } from '@components/common'

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <Head />
      <Layout className={clsx(cal.variable, inter.variable)}>
        <Component {...pageProps} />
      </Layout>
    </PlausibleProvider>
  )
}
