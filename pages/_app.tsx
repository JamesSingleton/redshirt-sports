import '@styles/main.css'
import { FC, useEffect } from 'react'
import type { AppProps } from 'next/app'
import Script from 'next/script'
import { Head } from '@components/common'

const Noop: FC = ({ children }) => <>{children}</>

export default function MyApp({ Component, pageProps }: AppProps) {
  const Layout = (Component as any).Layout || Noop

  const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID

  useEffect(() => {
    document.body.classList?.remove('loading')
  }, [])

  return (
    <>
      <Head />
      <Script
        id="adsense-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
               (adsbygoogle = window.adsbygoogle || []).push({
                   google_ad_client: '${ADSENSE_ID}',
                   enable_page_level_ads: true
              });
                `,
        }}
      />
      <Layout pageProps={pageProps}>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
