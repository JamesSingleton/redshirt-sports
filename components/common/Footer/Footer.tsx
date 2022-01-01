import { SVGProps } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'

const navigation = {
  football: [
    { name: 'FCS', href: '/fcs' },
    { name: 'FBS', href: '/fbs' },
  ],
  media: [
    {
      name: 'Podcast',
      href: 'https://podcasts.apple.com/us/podcast/fcs-nation/id1436799349?mt=2&ls=1',
    },
  ],
  company: [
    { name: 'Meet the Team', href: '/authors' },
    { name: 'Advertising', href: '/advertising' },
  ],
  legal: [{ name: 'Privacy', href: '/privacy-policy' }],
  social: [
    {
      name: 'Twitter',
      href: 'https://twitter.com/_redshirtsports',
      icon: (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
  ],
}

export default function Footer() {
  const plausible = usePlausible()
  return (
    <footer className="bg-gray-800" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Image
              className="h-10"
              src="/images/icons/RS_red.svg"
              alt="Company name"
              width="74"
              height="74"
            />
            <p className="text-gray-300 text-base">
              Your go to source for all things FCS.
            </p>
            <div className="flex space-x-6">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Football
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.football.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} prefetch={false}>
                        <a
                          onClick={() =>
                            plausible('clickOnFooter', {
                              props: {
                                item: item.name,
                              },
                            })
                          }
                          className="text-base text-gray-300 hover:text-white"
                        >
                          {item.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Media
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.media.map((item) => (
                    <li key={item.name}>
                      <a
                        onClick={() =>
                          plausible('clickOnFooter', {
                            props: {
                              item: item.name,
                            },
                          })
                        }
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-gray-300 hover:text-white"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Company
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} prefetch={false}>
                        <a
                          onClick={() =>
                            plausible('clickOnFooter', {
                              props: {
                                item: item.name,
                              },
                            })
                          }
                          className="text-base text-gray-300 hover:text-white"
                        >
                          {item.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Legal
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} prefetch={false}>
                        <a
                          onClick={() =>
                            plausible('clickOnFooter', {
                              props: {
                                item: item.name,
                              },
                            })
                          }
                          className="text-base text-gray-300 hover:text-white"
                        >
                          {item.name}
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy;
            {`${new Date().getFullYear()} Redshirt Sports. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  )
}
