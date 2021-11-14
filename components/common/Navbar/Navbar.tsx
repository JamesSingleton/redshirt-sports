import { Fragment, FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import cn from 'classnames'
import { Popover, Transition } from '@headlessui/react'
import {
  BriefcaseIcon,
  InformationCircleIcon,
  MenuIcon,
  ShieldCheckIcon,
  PencilAltIcon,
  XIcon,
  UserGroupIcon,
} from '@heroicons/react/outline'
import { ChevronDownIcon, SearchIcon } from '@heroicons/react/solid'
import NavbarRoot from './NavbarRoot'

const company = [
  { name: 'Meet the Team', href: '/about', icon: UserGroupIcon },
  { name: 'About', href: '/about', icon: InformationCircleIcon },
  { name: 'Privacy', href: '/privacy-policy', icon: ShieldCheckIcon },
  { name: 'Contact Us', href: '/contact-us', icon: PencilAltIcon },
]
const resources = [{ name: 'Partners', href: '/partners', icon: BriefcaseIcon }]
const blogPosts = [
  {
    id: 1,
    name: 'FCS: Week 11 Resumes For The Top 10-Ranked Teams',
    href: '#',
    preview: 'Top 10 teams and their resumes.',
    imageUrl:
      'https://herosports.com/wp-content/uploads/2021/11/Kennesaw-Football-Top-25-750x375.jpeg',
  },
  {
    id: 2,
    name: 'James Madison Announces Transition To FBS',
    href: '#',
    preview:
      'It was the culmination of years of scuttlebutt and rumors Saturday morning at the Atlantic Union Bank Center.',
    imageUrl:
      'https://herosports.com/wp-content/uploads/2021/11/JMU-Sun-Belt-750x375.jpg',
  },
]

const Navbar: FC = () => {
  return (
    <NavbarRoot>
      <div
        className="absolute inset-0 shadow z-30 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-20">
        <div className="max-w-8xl mx-auto flex justify-between items-center px-4 py-5 sm:px-6 sm:py-4 lg:px-8 md:justify-start md:space-x-10">
          <div>
            <Link href="/">
              <a className="flex">
                <span className="sr-only">Redshirt Sports</span>
                <Image
                  className="h-8 w-auto sm:h-10"
                  src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                  alt=""
                  width="40"
                  height="40"
                />
              </a>
            </Link>
          </div>
          <div className="hidden md:flex-1 md:flex md:items-center md:justify-between">
            <Popover.Group as="nav" className="flex space-x-10">
              <Link href="/fbs">
                <a className="text-base px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                  FBS
                </a>
              </Link>
              <Link href="/fcs">
                <a className="text-base px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                  FCS
                </a>
              </Link>
              <Popover>
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={cn(
                        open ? 'text-white bg-gray-900' : 'text-gray-300',
                        'group px-3 py-2 rounded-md inline-flex items-center text-base font-medium hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                      )}
                    >
                      <span>More</span>
                      <ChevronDownIcon
                        className={cn(
                          open ? 'text-white' : 'text-gray-300',
                          'ml-2 h-5 w-5 group-hover:text-white group-hover:bg-gray-700'
                        )}
                        aria-hidden="true"
                      />
                    </Popover.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 -translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 -translate-y-1"
                    >
                      <Popover.Panel className="hidden md:block absolute z-10 top-full inset-x-0 transform shadow-lg">
                        <div className="absolute inset-0 flex">
                          <div className="bg-white w-1/2" />
                          <div className="bg-gray-50 w-1/2" />
                        </div>
                        <div className="relative max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-2">
                          <nav className="grid gap-y-10 px-4 py-8 bg-white sm:grid-cols-2 sm:gap-x-8 sm:py-12 sm:px-6 lg:px-8 xl:pr-12">
                            <div>
                              <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
                                Company
                              </h3>
                              <ul role="list" className="mt-5 space-y-6">
                                {company.map((item) => (
                                  <li key={item.name} className="flow-root">
                                    <Link href={item.href}>
                                      <a className="-m-3 p-3 flex items-center rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">
                                        <item.icon
                                          className="flex-shrink-0 h-6 w-6 text-gray-400"
                                          aria-hidden="true"
                                        />
                                        <span className="ml-4">
                                          {item.name}
                                        </span>
                                      </a>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
                                Resources
                              </h3>
                              <ul role="list" className="mt-5 space-y-6">
                                {resources.map((item) => (
                                  <li key={item.name} className="flow-root">
                                    <Link href={item.href}>
                                      <a className="-m-3 p-3 flex items-center rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">
                                        <item.icon
                                          className="flex-shrink-0 h-6 w-6 text-gray-400"
                                          aria-hidden="true"
                                        />
                                        <span className="ml-4">
                                          {item.name}
                                        </span>
                                      </a>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </nav>
                          <div className="bg-gray-50 px-4 py-8 sm:py-12 sm:px-6 lg:px-8 xl:pl-12">
                            <div>
                              <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
                                Featured Articles
                              </h3>
                              <ul role="list" className="mt-6 space-y-6">
                                {blogPosts.map((post) => (
                                  <li key={post.id} className="flow-root">
                                    <a
                                      href={post.href}
                                      className="-m-3 p-3 flex rounded-lg hover:bg-gray-100"
                                    >
                                      <div className="hidden sm:block flex-shrink-0">
                                        <Image
                                          className="w-32 h-20 object-cover rounded-md"
                                          src={post.imageUrl}
                                          alt=""
                                          width="128"
                                          height="80"
                                        />
                                      </div>
                                      <div className="w-0 flex-1 sm:ml-8">
                                        <h4 className="text-base font-medium text-gray-900 truncate">
                                          {post.name}
                                        </h4>
                                        <p className="mt-1 text-sm text-gray-500">
                                          {post.preview}
                                        </p>
                                      </div>
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </Popover.Group>
          </div>
          <div className="flex-1 flex justify-center px-4 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-gray-900 sm:text-sm"
                  placeholder="Search"
                  type="search"
                />
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <Popover.Button className="bg-gray-800 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
              <span className="sr-only">Open menu</span>
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </Popover.Button>
          </div>
        </div>
      </div>

      <Transition
        as={Fragment}
        enter="duration-200 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel
          focus
          className="absolute z-30 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
        >
          <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
            <div className="pt-5 pb-6 px-5 sm:pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <Image
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                    alt="Workflow"
                    height="32"
                    width="32"
                  />
                </div>
                <div className="-mr-2">
                  <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Close menu</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </Popover.Button>
                </div>
              </div>
              <div className="mt-6 sm:mt-8">
                <nav>
                  <div className="grid gap-7 sm:grid-cols-2 sm:gap-y-8 sm:gap-x-4">
                    <Link href="/fcs">
                      <a className="rounded-md text-base font-medium text-gray-900 hover:text-gray-700">
                        FCS
                      </a>
                    </Link>

                    <Link href="/fbs">
                      <a className="rounded-md text-base font-medium text-gray-900 hover:text-gray-700">
                        FBS
                      </a>
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-8 rounded-b-md">
              <div>
                <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">
                  Featured Articles
                </h3>
                <ul role="list" className="mt-6 space-y-6">
                  {blogPosts.map((post) => (
                    <li key={post.id} className="flow-root">
                      <a
                        href={post.href}
                        className="p-3 flex rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex-shrink-0">
                          <Image
                            className="w-32 h-20 object-cover rounded-md"
                            src={post.imageUrl}
                            alt=""
                            width="128"
                            height="80"
                          />
                        </div>
                        <div className="ml-4 w-0 flex-1 sm:ml-8">
                          <h4 className="text-base font-medium text-gray-900 truncate">
                            {post.name}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            {post.preview}
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </NavbarRoot>
  )
}

export default Navbar
