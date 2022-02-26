import { FC, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Menu, Transition } from '@headlessui/react'
import { ShareIcon, DuplicateIcon, InboxIcon } from '@heroicons/react/outline'
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { usePlausible } from 'next-plausible'
import { parseISO, format } from 'date-fns'
import {
  TwitterShareButton,
  FacebookShareButton,
  EmailShareButton,
} from 'react-share'
import { urlForImage } from '@lib/sanity'
import type { AuthorTypes } from '@lib/types/author'

interface PostHeaderProps {
  title: string
  publishedAt: string
  author: AuthorTypes
  category: string
  excerpt: string
  estimatedReadingTime: number
  slug: string
}
const pages = [
  { name: 'Projects', href: '#', current: false },
  { name: 'Project Nero', href: '#', current: true },
]

const PostHeader: FC<PostHeaderProps> = ({
  title,
  publishedAt,
  author,
  category,
  excerpt,
  estimatedReadingTime,
  slug,
}) => {
  const plausible = usePlausible()
  const socialShareUrl = `https://www.redshirtsports.xyz/${slug}`
  const { asPath } = useRouter()

  const ariaCurrent = `/${slug}` === asPath ? 'page' : undefined

  return (
    <header className="container mx-auto px-4">
      <div className="mx-auto max-w-screen-md">
        <div className="space-y-5">
          <div className="flex flex-wrap space-x-2">
            <nav
              className="flex max-w-xs sm:max-w-none"
              aria-label="Breadcrumb"
            >
              <ol role="list" className="flex items-center space-x-4 truncate">
                <li>
                  <div>
                    <Link href="/" prefetch={false}>
                      <a
                        className="hover:text-gray-500"
                        onClick={() =>
                          plausible('clickOnBreadCrumb', {
                            props: {
                              location: 'Home',
                            },
                          })
                        }
                      >
                        <HomeIcon
                          className="h-5 w-5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span className="sr-only">Home</span>
                      </a>
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className="h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <Link href={`/${category.toLowerCase()}`} prefetch={false}>
                      <a
                        className="ml-4 text-sm font-medium hover:text-gray-500"
                        onClick={() =>
                          plausible('clickOnBreadCrumb', {
                            props: {
                              location: category,
                            },
                          })
                        }
                      >
                        {category}
                      </a>
                    </Link>
                  </div>
                </li>
                <li className="overflow-hidden">
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className="h-5 w-5 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <Link href={`/${slug}`} prefetch={false}>
                      <a
                        className="ml-4 truncate text-sm font-medium hover:text-gray-500"
                        aria-current={ariaCurrent}
                        onClick={() =>
                          plausible('clickOnBreadCrumb', {
                            props: {
                              location: title,
                            },
                          })
                        }
                      >
                        {title}
                      </a>
                    </Link>
                  </div>
                </li>
              </ol>
            </nav>
          </div>
          <h1 className="max-w-4xl text-3xl font-semibold text-slate-900 dark:text-slate-50 md:text-4xl lg:text-5xl">
            {title}
          </h1>
          <span className="block pb-1 text-base md:text-lg">{excerpt}</span>
          <div className="w-full border-b border-slate-100 dark:border-slate-800" />
          <div className="flex flex-col justify-between space-y-5 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-5">
            <div className="flex shrink-0 flex-wrap items-center text-left text-sm leading-none text-slate-700 dark:text-slate-200">
              <Link href={`/authors/${author.slug}`} prefetch={false}>
                <a
                  onClick={() =>
                    plausible('clickOnAuthor', {
                      props: {
                        author: author.name,
                        location: 'Post Header - Author Image',
                      },
                    })
                  }
                  className="flex items-center space-x-2"
                >
                  <div className="relative inline-flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-semibold uppercase text-slate-100 shadow-inner ring-1 ring-white dark:ring-slate-900 sm:h-11 sm:w-11">
                    <Image
                      className="absolute inset-0 h-full w-full object-cover"
                      src={urlForImage(author.image).url()!}
                      alt={`Profile image of ${author.name}`}
                      width={44}
                      height={44}
                    />
                  </div>
                </a>
              </Link>
              <div className="ml-3">
                <div className="flex items-center">
                  <Link href={`/authors/${author.slug}`} prefetch={false}>
                    <a
                      onClick={() =>
                        plausible('clickOnAuthor', {
                          props: {
                            author: author.name,
                            location: 'Post Header - Author Name',
                          },
                        })
                      }
                      className="block font-semibold"
                    >
                      {author.name}
                    </a>
                  </Link>
                </div>
                <div className="mt-2 text-xs">
                  <span>
                    <time dateTime={publishedAt}>
                      {format(parseISO(publishedAt), 'LLLL	d, yyyy')}
                    </time>
                  </span>
                  <span className="mx-2 font-semibold">·</span>
                  <span>{`${estimatedReadingTime} min read`}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-row items-center space-x-2.5">
              <Menu as="div" className="relative z-10 inline-block text-left">
                <Menu.Button
                  aria-label="Share Article"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <ShareIcon aria-hidden="true" className="h-5 w-5" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1 ">
                      <Menu.Item
                        onClick={() =>
                          plausible('ShareArticle', {
                            props: {
                              article: title,
                              method: 'Facebook',
                            },
                          })
                        }
                      >
                        {({ active }) => (
                          <FacebookShareButton
                            url={socialShareUrl}
                            resetButtonStyle={false}
                            className={`${
                              active
                                ? 'bg-slate-500 text-slate-50'
                                : 'text-slate-900'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            {active ? (
                              <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="mr-2 h-5 w-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="mr-2 h-5 w-5"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            Facebook
                          </FacebookShareButton>
                        )}
                      </Menu.Item>
                      <Menu.Item
                        onClick={() =>
                          plausible('ShareArticle', {
                            props: {
                              article: title,
                              method: 'Twitter',
                            },
                          })
                        }
                      >
                        {({ active }) => (
                          <TwitterShareButton
                            url={socialShareUrl}
                            resetButtonStyle={false}
                            title={title}
                            hashtags={['FCS', 'redshirtsports']}
                            related={['FCSNationRadio1']}
                            className={`${
                              active
                                ? 'bg-slate-500 text-slate-50'
                                : 'text-slate-900'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            {active ? (
                              <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="mr-2 h-5 w-5"
                              >
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                              </svg>
                            ) : (
                              <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="mr-2 h-5 w-5"
                              >
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                              </svg>
                            )}
                            Twitter
                          </TwitterShareButton>
                        )}
                      </Menu.Item>
                      <Menu.Item
                        onClick={() =>
                          plausible('ShareArticle', {
                            props: {
                              article: title,
                              method: 'Copy Link',
                            },
                          })
                        }
                      >
                        {({ active }) => (
                          <button
                            className={`${
                              active
                                ? 'bg-slate-500 text-slate-50'
                                : 'text-slate-900'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `https://www.redshirtsports.xyz/${slug}`
                              )
                            }
                          >
                            {active ? (
                              <DuplicateIcon
                                className="mr-2 h-5 w-5"
                                aria-hidden="true"
                              />
                            ) : (
                              <DuplicateIcon
                                className="mr-2 h-5 w-5"
                                aria-hidden="true"
                              />
                            )}
                            Copy Link
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item
                        onClick={() =>
                          plausible('ShareArticle', {
                            props: {
                              article: title,
                              method: 'Email',
                            },
                          })
                        }
                      >
                        {({ active }) => (
                          <EmailShareButton
                            resetButtonStyle={false}
                            url={socialShareUrl}
                            subject={title}
                            openShareDialogOnClick={true}
                            className={`${
                              active
                                ? 'bg-slate-500 text-slate-50'
                                : 'text-slate-900'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            {active ? (
                              <InboxIcon
                                className="mr-2 h-5 w-5"
                                aria-hidden="true"
                              />
                            ) : (
                              <InboxIcon
                                className="mr-2 h-5 w-5"
                                aria-hidden="true"
                              />
                            )}
                            Email
                          </EmailShareButton>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default PostHeader
