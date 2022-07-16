import PlausibleProvider from 'next-plausible'
import { LazyMotion, domAnimation, AnimatePresence } from 'framer-motion'
import '@styles/globals.css'

import { Head } from '@components/common'

import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PlausibleProvider domain="redshirtsports.xyz" trackOutboundLinks={true}>
      <Head />
      <LazyMotion features={domAnimation}>
        <AnimatePresence exitBeforeEnter>
          <Component {...pageProps} />
        </AnimatePresence>
      </LazyMotion>
    </PlausibleProvider>
  )
}
