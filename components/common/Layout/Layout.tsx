import React, { FC } from 'react'
import cn from 'classnames'
import { Navbar, Footer } from '@components/common'

const Layout: FC = ({ children }) => {
  return (
    <div className="h-full bg-gray-50 mx-auto transition-colors duration-150 relative overflow-hidden">
      <Navbar />
      <main className="fit">{children}</main>
      <Footer />
    </div>
  )
}

export default Layout
