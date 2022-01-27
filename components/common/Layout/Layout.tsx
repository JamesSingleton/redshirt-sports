import React, { FC } from 'react'
import { LogoJsonLd, OrganizationJsonLd } from 'next-seo'
import { Navbar, Footer } from '@components/common'

const Layout: FC = ({ children }) => {
  return (
    <>
      <OrganizationJsonLd
        organizationType="NewsMediaOrganization"
        id="https://www.redshirtsports.xyz"
        logo="https://www.redshirtsports.xyz/images/icons/RS_horizontal_513x512.png"
        url="https://www.redshirtsports.xyz"
        name="Redshirt Sports"
        sameAs={['https://twitter.com/_redshirtsports']}
      />
      <LogoJsonLd
        logo="https://www.redshirtsports.xyz/images/icons/RS_horizontal_513x512.png"
        url="https://www.redshirtsports.xyz"
      />
      <div className="relative mx-auto h-full overflow-hidden transition-colors duration-150">
        <Navbar />
        <main className="fit">{children}</main>
        <Footer />
      </div>
    </>
  )
}

export default Layout
