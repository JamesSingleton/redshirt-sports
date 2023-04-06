import { Navbar, Footer } from '@components/common'

import { WithChildren, WithClassName } from '@types'

export default function Layout({ children, className }: WithChildren & WithClassName) {
  return (
    <>
      <Navbar />
      <main className={className}>{children}</main>
      <Footer />
    </>
  )
}
