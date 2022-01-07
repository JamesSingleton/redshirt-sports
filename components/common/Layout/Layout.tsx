import React, { FC } from 'react'
import dynamic from 'next/dynamic'
import { LogoJsonLd } from 'next-seo'
import LazyHydrate from 'react-lazy-hydration'
import { Navbar } from '@components/common'
const Footer = dynamic(() => import('@components/common/Footer'))

const Layout: FC = ({ children }) => {
  return (
    <>
      <LogoJsonLd
        logo="https://www.redshirtsports.xyz/images/icons/RS_horizontal_513x512.png"
        url="https://www.redshirtsports.xyz"
      />
      <div className="h-full bg-gray-50 mx-auto transition-colors duration-150 relative overflow-hidden">
        <Navbar />
        <main className="fit">{children}</main>
        <LazyHydrate whenVisible>
          <Footer />
        </LazyHydrate>
      </div>
    </>
  )
}

export default Layout
