import '@styles/main.css'
import { FC, useEffect } from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import PlausibleProvider from 'next-plausible'
import { m, LazyMotion, AnimatePresence, domAnimation } from 'framer-motion'
import { Head } from '@components/common'

const Noop: FC = ({ children }) => <>{children}</>

export default function MyApp({ Component, pageProps }: AppProps) {
  const Layout = (Component as any).Layout || Noop
  const router = useRouter()

  useEffect(() => {
    document.body.classList?.remove('loading')
  }, [])

  return (
    <PlausibleProvider domain="redshirtsports.xyz" trackOutboundLinks={true}>
      <Head />
      <Layout pageProps={pageProps}>
        <LazyMotion features={domAnimation}>
          <AnimatePresence exitBeforeEnter>
            <m.div
              key={router.route}
              initial="initial"
              animate="animate"
              variants={{
                initial: {
                  opacity: 0,
                },
                animate: {
                  opacity: 1,
                },
              }}
            >
              <Component {...pageProps} />
            </m.div>
          </AnimatePresence>
        </LazyMotion>
      </Layout>
    </PlausibleProvider>
  )
}
