import '@styles/main.css'
import { FC, useEffect } from 'react'
import type { AppProps } from 'next/app'
import Router from 'next/router'
import PlausibleProvider from 'next-plausible'
import ProgressBar from '@badrap/bar-of-progress'
import { Head } from '@components/common'

type NoopProps = {
  children: React.ReactNode
}

const Noop: FC<NoopProps> = ({ children }) => <>{children}</>

const progress = new ProgressBar({
  size: 2,
  color: '#38bdf8',
  className: 'bar-of-progress',
  delay: 100,
})

// this fixes safari jumping to the bottom of the page
// when closing the search modal using the `esc` key
if (typeof window !== 'undefined') {
  progress.start()
  progress.finish()
}

Router.events.on('routeChangeStart', () => progress.start())
Router.events.on('routeChangeComplete', () => progress.finish())
Router.events.on('routeChangeError', () => progress.finish())

export default function MyApp({ Component, pageProps }: AppProps) {
  const Layout = (Component as any).Layout || Noop

  useEffect(() => {
    document.body.classList?.remove('loading')
  }, [])

  return (
    <PlausibleProvider domain="redshirtsports.xyz" trackOutboundLinks={true}>
      <Head />
      <Layout pageProps={pageProps}>
        <Component {...pageProps} />
      </Layout>
    </PlausibleProvider>
  )
}
