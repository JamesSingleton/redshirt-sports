import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import Navbar from '../Navbar'
import Footer from '../Footer'

import { WithChildren, Meta } from '@types'

interface LayoutProps extends WithChildren {
  meta?: Meta
  siteId?: string
  subdomain?: string
}

export default function Layout({ meta, children, subdomain }: LayoutProps) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
