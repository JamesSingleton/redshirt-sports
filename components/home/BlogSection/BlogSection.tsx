import { Fragment, FC } from 'react'
import Image from 'next/image'
import { Tab } from '@headlessui/react'
import cn from 'classnames'
import { Menu, Transition } from '@headlessui/react'
import {
  CodeIcon,
  DotsVerticalIcon,
  EyeIcon,
  FlagIcon,
  ShareIcon,
  StarIcon,
  ThumbUpIcon,
} from '@heroicons/react/solid'

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

const BlogSection: FC = () => {
  return (
    <div className="py-4">
      <Tab.Group>
        <Tab.List
          className="relative z-0 rounded-lg shadow flex divide-x divide-gray-200"
          aria-label="Tabs"
        >
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={cn(
                  selected
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700',

                  'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10'
                )}
              >
                <span>Trending</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    selected ? 'bg-rose-500' : 'bg-transparent',
                    'absolute inset-x-0 bottom-0 h-0.5'
                  )}
                />
              </button>
            )}
          </Tab>
          <Tab as={Fragment}>
            {({ selected }) => (
              <button
                className={cn(
                  selected
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700',

                  'group relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10'
                )}
              >
                <span>Recent</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    selected ? 'bg-rose-500' : 'bg-transparent',
                    'absolute inset-x-0 bottom-0 h-0.5'
                  )}
                />
              </button>
            )}
          </Tab>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel className="mt-4">
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
                            <ThumbUpIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
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
          </Tab.Panel>
          <Tab.Panel className="mt-4">
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
                            <ThumbUpIcon
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
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
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default BlogSection
