import { SVGProps } from 'react'
import Link from 'next/link'

import { LargeLogo } from '@components/common'

const navigation = {
  site: [
    { name: 'FCS', href: '/fcs' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy' },
  ],
  social: [
    {
      name: 'Twitter',
      href: 'https://twitter.com/_redshirtsports',
      Icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/Redshirt-Sports-103392312412641',
      Icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ],
}

const Footer = () => {
  return (
    <footer className="bg-white py-12 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-screen-2xl lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center justify-center">
            <Link
              href="/"
              prefetch={false}
              className="block"
              aria-label="Redshirt Sports Horizontal Logo, click to go to the homepage"
            >
              <LargeLogo className="h-10 w-auto" />
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center sm:mt-0">
            <ul className="flex items-center space-x-3 sm:ml-4">
              {navigation.social.map(({ name, href, Icon }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-transparent transition duration-300 ease-in-out sm:h-12 sm:w-12"
                  >
                    <span className="sr-only">{name}</span>
                    <Icon
                      aria-hidden="true"
                      className="h-4 w-4 transform text-slate-700 transition ease-in-out"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-300/70 pt-10 md:flex md:items-center md:justify-between">
          <nav
            aria-label="Footer"
            className="-my-2 flex flex-wrap items-center justify-center space-x-5 md:justify-start"
          >
            {navigation.site.map(({ name, href }) => (
              <Link
                key={name}
                href={href}
                prefetch={false}
                className="py-2 text-base text-slate-500 transition duration-300 ease-in-out"
              >
                {name}
              </Link>
            ))}
          </nav>
          <p className="ml-0 mt-8 flex shrink-0 items-center justify-center text-base text-slate-500 md:ml-6 md:mt-0">
            &copy;
            {`${new Date().getFullYear()} Redshirt Sports. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
