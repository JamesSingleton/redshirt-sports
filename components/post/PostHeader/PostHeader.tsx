import { FC, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { ShareIcon, DuplicateIcon, InboxIcon } from '@heroicons/react/outline'
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
  return (
    <header className="container mx-auto px-4">
      <div className="max-w-screen-md mx-auto">
        <div className="space-y-5">
          <div className="flex flex-wrap space-x-2">
            <a
              href={`/${category.toLowerCase()}`}
              className="transition-colors hover:text-slate-50 duration-300 relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-slate-50 bg-red-800 hover:bg-red-600"
              onClick={() =>
                plausible('clickOnPostCategory', {
                  props: {
                    category: category,
                  },
                })
              }
            >
              {category}
            </a>
          </div>
          <h1 className="text-slate-900 dark:text-slate-50 font-semibold text-3xl md:text-4xl lg:text-5xl max-w-4xl">
            {title}
          </h1>
          <span className="block text-base md:text-lg pb-1">{excerpt}</span>
          <div className="w-full border-b border-slate-100 dark:border-slate-800" />
          <div className="flex flex-col sm:flex-row justify-between sm:items-end space-y-5 sm:space-y-0 sm:space-x-5">
            <div className="flex items-center flex-wrap text-slate-700 text-left dark:text-slate-200 text-sm leading-none shrink-0">
              <Link href={`/authors/${author.slug}`} prefetch={false}>
                <a className="flex items-center space-x-2">
                  <div className="relative flex-shrink-0 inline-flex items-center justify-center overflow-hidden text-slate-100 uppercase font-semibold shadow-inner rounded-full h-10 w-10 sm:h-11 sm:w-11 text-xl ring-1 ring-white dark:ring-slate-900">
                    <Image
                      className="absolute inset-0 w-full h-full object-cover"
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
                    <a className="block font-semibold">{author.name}</a>
                  </Link>
                </div>
                <div className="text-xs mt-2">
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
            <div className="flex flex-row space-x-2.5 items-center">
              <Menu as="div" className="relative inline-block text-left z-10">
                <Menu.Button
                  aria-label="Share Article"
                  className="flex items-center justify-center rounded-full h-9 w-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
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
                  <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1 ">
                      <Menu.Item>
                        {({ active }) => (
                          <FacebookShareButton
                            url={socialShareUrl}
                            resetButtonStyle={false}
                            className={`${
                              active
                                ? 'bg-slate-500 text-slate-50'
                                : 'text-slate-900'
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                          >
                            {active ? (
                              <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="h-5 w-5 mr-2"
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
                                className="h-5 w-5 mr-2"
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
                      <Menu.Item>
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
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                          >
                            {active ? (
                              <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="h-5 w-5 mr-2"
                              >
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                              </svg>
                            ) : (
                              <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="h-5 w-5 mr-2"
                              >
                                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                              </svg>
                            )}
                            Twitter
                          </TwitterShareButton>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active
                                ? 'bg-slate-500 text-slate-50'
                                : 'text-slate-900'
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `https://www.redshirtsports.xyz/${slug}`
                              )
                            }
                          >
                            {active ? (
                              <DuplicateIcon
                                className="w-5 h-5 mr-2"
                                aria-hidden="true"
                              />
                            ) : (
                              <DuplicateIcon
                                className="w-5 h-5 mr-2"
                                aria-hidden="true"
                              />
                            )}
                            Copy Link
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
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
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                          >
                            {active ? (
                              <InboxIcon
                                className="w-5 h-5 mr-2"
                                aria-hidden="true"
                              />
                            ) : (
                              <InboxIcon
                                className="w-5 h-5 mr-2"
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
