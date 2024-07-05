import { JSX, SVGProps } from 'react'
import Link from 'next/link'

import { LargeLogo } from '@/components/common'
import { Facebook, Twitter, RSSIcon } from '@/components/common/icons'

const navigation = {
  divisions: [
    { name: 'FBS', href: '/news/fbs' },
    { name: 'FCS', href: '/news/fcs' },
    { name: 'D2', href: '/news/d2' },
    { name: 'D3', href: '/news/d3' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  support: [{ name: 'Privacy Policy', href: '/privacy' }],
  social: [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/RedshirtSportsNews',
      icon: (
        props: JSX.IntrinsicAttributes & JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>,
      ) => <Facebook {...props} />,
    },
    {
      name: 'Twitter',
      href: 'https://x.com/_redshirtsports',
      icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => <Twitter {...props} />,
    },
  ],
}

export default function Footer() {
  return (
    <footer aria-labelledby="footer-heading" className="border-t">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <Link href="/" aria-label="Redshirt Sports Logo, click to go to the homepage">
              <LargeLogo className="h-10 w-auto" />
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-primary">Divisions</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.divisions.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-secondary-foreground"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-lg font-semibold leading-6 text-primary">Company</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-sm leading-6 text-secondary-foreground">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-primary">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.support.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm leading-6 text-secondary-foreground"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-lg font-semibold leading-6 text-primary">Connect With Us</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {navigation.social.map((item) => (
                    <li key={item.name}>
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href={item.href}
                        className="flex items-center text-sm leading-6 text-secondary-foreground"
                      >
                        <item.icon className="h-4 w-4 fill-current" aria-hidden="true" />
                        <span className="ml-2">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-sm leading-5 text-primary">
            &copy; {new Date().getFullYear()} Redshirt Sports. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
