import React, { FC } from 'react'
import { LogoJsonLd } from 'next-seo'
import { Navbar, Footer } from '@components/common'

const Layout: FC = ({ children }) => {
  return (
    <>
      <LogoJsonLd
        logo="https://www.redshirtsports.xyz/images/icons/RS_horizontal_513x512.png"
        url="https://www.redshirtsports.xyz"
      />
      <div className="h-full mx-auto transition-colors duration-150 relative overflow-hidden">
        <Navbar />
        <main className="fit">{children}</main>
        <Footer />
      </div>
    </>
  )
}

export default Layout
