import React, { FC } from 'react'
import cn from 'classnames'
import { Navbar, Footer } from '@components/common'

const Layout: FC = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main className="fit">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout
