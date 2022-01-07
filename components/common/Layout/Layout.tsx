import React, { FC } from 'react'
import { useRouter } from 'next/router'
import { m, LazyMotion, AnimatePresence, domAnimation } from 'framer-motion'
import { LogoJsonLd } from 'next-seo'
import { Navbar, Footer } from '@components/common'

const Layout: FC = ({ children }) => {
  const router = useRouter()
  return (
    <>
      <LogoJsonLd
        logo="https://www.redshirtsports.xyz/images/icons/RS_horizontal_513x512.png"
        url="https://www.redshirtsports.xyz"
      />
      <div className="h-full bg-gray-50 mx-auto transition-colors duration-150 relative overflow-hidden">
        <Navbar />
        <LazyMotion features={domAnimation}>
          <AnimatePresence exitBeforeEnter>
            <m.main
              key={router.route}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="fit"
            >
              {children}
            </m.main>
          </AnimatePresence>
        </LazyMotion>
        <Footer />
      </div>
    </>
  )
}

export default Layout
