import { Navbar, Footer } from '@components/common'

import { WithChildren } from '@types'

export default function Layout({ children }: WithChildren) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
