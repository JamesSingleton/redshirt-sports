import React, { FC } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
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
        <motion.main
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
          className="fit"
        >
          {children}
        </motion.main>
        <Footer />
      </div>
    </>
  )
}

export default Layout
