import { Fragment } from 'react'
import Image from 'next/image'
import cn from 'classnames'
import { Menu, Transition } from '@headlessui/react'
import {
  ChatAltIcon,
  CodeIcon,
  DotsVerticalIcon,
  EyeIcon,
  FlagIcon,
  ShareIcon,
  StarIcon,
  ThumbUpIcon,
} from '@heroicons/react/solid'

import { Layout } from '@components/common'
import { Hero, BlogSection, FeaturedArticle } from '@components/home'

const trendingPosts = [
  {
    id: 1,
    user: {
      name: 'Floyd Miles',
      imageUrl:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    body: 'What books do you have on your bookshelf just to look smarter than you actually are?',
    comments: 291,
  },
]
const tabs = [
  { name: 'Recent', href: '#', current: true },
  { name: 'Trending', href: '#', current: false },
]
const questions = [
  {
    id: '81614',
    likes: '29',
    views: '2.7k',
    author: {
      name: 'James Singleton',
      imageUrl: '/images/james_singleton.png',
      href: '#',
    },
    date: 'December 9 at 11:43 AM',
    datetime: '2020-12-09T11:43:00',
    href: '#',
    title: 'What would you have done differently if you ran Jurassic Park?',
    body: `
      <p>Jurassic Park was an incredible idea and a magnificent feat of engineering, but poor protocols and a disregard for human safety killed what could have otherwise been one of the best businesses of our generation.</p>
      <p>Ultimately, I think that if you wanted to run the park successfully and keep visitors safe, the most important thing to prioritize would be&hellip;</p>
    `,
  },
]
function Home() {
  return (
    <div className="py-0 sm:py-10 max-w-3xl mx-auto sm:px-6 lg:max-w-8xl lg:px-8 lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-9">
        <Hero />
        <div className="py-4 px-4 sm:px-0">
          <div className="sm:hidden">
            <label htmlFor="question-tabs" className="sr-only">
              Select a tab
            </label>
            <select
              id="question-tabs"
              className="block w-full rounded-md border-gray-300 text-base font-medium text-gray-900 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              defaultValue={tabs.find((tab) => tab.current)?.name}
            >
              {tabs.map((tab) => (
                <option key={tab.name}>{tab.name}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <nav
              className="relative z-0 rounded-lg shadow flex divide-x divide-gray-200"
              aria-label="Tabs"
            >
              {tabs.map((tab, tabIdx) => (
                <a
                  key={tab.name}
                  href={tab.href}
                  aria-current={tab.current ? 'page' : undefined}
                  className={cn(
                    tab.current
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700',
                    tabIdx === 0 ? 'rounded-l-lg' : '',
                    tabIdx === tabs.length - 1 ? 'rounded-r-lg' : '',
                    'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10'
                  )}
                >
                  <span>{tab.name}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      tab.current ? 'bg-rose-500' : 'bg-transparent',
                      'absolute inset-x-0 bottom-0 h-0.5'
                    )}
                  />
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div>
          <h1 className="sr-only">Recent questions</h1>
          <ul role="list" className="space-y-4">
            {questions.map((question) => (
              <li
                key={question.id}
                className="bg-white px-4 py-6 shadow sm:p-6 sm:rounded-lg"
              >
                <article aria-labelledby={'question-title-' + question.id}>
                  <div>
                    <div className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <Image
                          className="rounded-full"
                          src={question.author.imageUrl}
                          alt=""
                          width="40"
                          height="40"
                          // layout="responsive"
                          objectFit="cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          <a
                            href={question.author.href}
                            className="hover:underline"
                          >
                            {question.author.name}
                          </a>
                        </p>
                        <p className="text-sm text-gray-500">
                          <a href={question.href} className="hover:underline">
                            <time dateTime={question.datetime}>
                              {question.date}
                            </time>
                          </a>
                        </p>
                      </div>
                      <div className="flex-shrink-0 self-center flex">
                        <Menu
                          as="div"
                          className="relative inline-block text-left"
                        >
                          <div>
                            <Menu.Button className="-m-2 p-2 rounded-full flex items-center text-gray-400 hover:text-gray-600">
                              <span className="sr-only">Open options</span>
                              <DotsVerticalIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </Menu.Button>
                          </div>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <a
                                      href="#"
                                      className={cn(
                                        active
                                          ? 'bg-gray-100 text-gray-900'
                                          : 'text-gray-700',
                                        'flex px-4 py-2 text-sm'
                                      )}
                                    >
                                      <StarIcon
                                        className="mr-3 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                      />
                                      <span>Add to favorites</span>
                                    </a>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <a
                                      href="#"
                                      className={cn(
                                        active
                                          ? 'bg-gray-100 text-gray-900'
                                          : 'text-gray-700',
                                        'flex px-4 py-2 text-sm'
                                      )}
                                    >
                                      <CodeIcon
                                        className="mr-3 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                      />
                                      <span>Embed</span>
                                    </a>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <a
                                      href="#"
                                      className={cn(
                                        active
                                          ? 'bg-gray-100 text-gray-900'
                                          : 'text-gray-700',
                                        'flex px-4 py-2 text-sm'
                                      )}
                                    >
                                      <FlagIcon
                                        className="mr-3 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                      />
                                      <span>Report content</span>
                                    </a>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                    </div>
                    <h2
                      id={'question-title-' + question.id}
                      className="mt-4 text-base font-medium text-gray-900"
                    >
                      {question.title}
                    </h2>
                  </div>
                  <div
                    className="mt-2 text-sm text-gray-700 space-y-4"
                    dangerouslySetInnerHTML={{ __html: question.body }}
                  />
                  <div className="mt-6 flex justify-between space-x-8">
                    <div className="flex space-x-6">
                      <span className="inline-flex items-center text-sm">
                        <button
                          type="button"
                          className="inline-flex space-x-2 text-gray-400 hover:text-gray-500"
                        >
                          <ThumbUpIcon className="h-5 w-5" aria-hidden="true" />
                          <span className="font-medium text-gray-900">
                            {question.likes}
                          </span>
                          <span className="sr-only">likes</span>
                        </button>
                      </span>
                      <span className="inline-flex items-center text-sm">
                        <button
                          type="button"
                          className="inline-flex space-x-2 text-gray-400 hover:text-gray-500"
                        >
                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                          <span className="font-medium text-gray-900">
                            {question.views}
                          </span>
                          <span className="sr-only">views</span>
                        </button>
                      </span>
                    </div>
                    <div className="flex text-sm">
                      <span className="inline-flex items-center text-sm">
                        <button
                          type="button"
                          className="inline-flex space-x-2 text-gray-400 hover:text-gray-500"
                        >
                          <ShareIcon className="h-5 w-5" aria-hidden="true" />
                          <span className="font-medium text-gray-900">
                            Share
                          </span>
                        </button>
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <aside className="hidden xl:block xl:col-span-3">
        <div className="sticky top-4 space-y-4">
          <FeaturedArticle
            title="Featured FCS"
            imageSrc="https://vmikeydets.com/images/2021/10/2/8CS_8745.JPG?width=1920&quality=80&format=jpg"
            imageAlt="VMI vs The Citadel"
            articleTitle="VMI falls to rival The Citadel 35-24 in Military Classic of the South"
            articleHref="/fcs/vmi-vs-the-citadel"
            articleSnippet="The Bulldogs had six pass attempts with only two completions. But their was certainly damage done on the ground--363 yards and 4 touchdowns."
          />
          <section aria-labelledby="trending-heading">
            <div className="bg-white rounded-lg shadow">
              <div>
                <h2
                  id="trending-heading"
                  className="p-6 pb-0 text-base font-medium text-gray-900"
                >
                  Featured FBS
                </h2>
                <div className="mt-6 flex flex-col overflow-hidden rounded-b-lg">
                  <div className="flex-shrink-0">
                    <Image
                      src="https://images.unsplash.com/photo-1589748057782-830457b1076f?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8"
                      alt=""
                      width="392"
                      height="192"
                      layout="responsive"
                      quality="75"
                      objectFit="cover"
                    />
                  </div>
                  <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <a href="#" className="block mt-2">
                        <p className="text-xl font-semibold text-gray-900">
                          Boost your conversion rate
                        </p>
                        <p className="mt-3 text-base text-gray-500">
                          Lorem ipsum dolor sit amet consectetur adipisicing
                          elit. Architecto accusantium praesentium eius, ut
                          atque fuga culpa, similique sequi cum eos quis
                          dolorum.
                        </p>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}

Home.Layout = Layout

export default Home
