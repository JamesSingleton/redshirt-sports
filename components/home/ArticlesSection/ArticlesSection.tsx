import { Fragment, FC } from 'react'
import cn from 'classnames'
import { Tab } from '@headlessui/react'

const announcements = [
  {
    id: 1,
    title: 'Office closed on July 2nd',
    preview:
      'Cum qui rem deleniti. Suscipit in dolor veritatis sequi aut. Vero ut earum quis deleniti. Ut a sunt eum cum ut repudiandae possimus. Nihil ex tempora neque cum consectetur dolores.',
  },
  {
    id: 2,
    title: 'New password policy',
    preview:
      'Alias inventore ut autem optio voluptas et repellendus. Facere totam quaerat quam quo laudantium cumque eaque excepturi vel. Accusamus maxime ipsam reprehenderit rerum id repellendus rerum. Culpa cum vel natus. Est sit autem mollitia.',
  },
  {
    id: 3,
    title: 'Office closed on July 2nd',
    preview:
      'Tenetur libero voluptatem rerum occaecati qui est molestiae exercitationem. Voluptate quisquam iure assumenda consequatur ex et recusandae. Alias consectetur voluptatibus. Accusamus a ab dicta et. Consequatur quis dignissimos voluptatem nisi.',
  },
]

const ArticlesSection: FC = () => {
  return (
    <section>
      <div className="bg-white rounded-lg shadow">
        <Tab.Group>
          <Tab.List
            className="relative rounded-lg z-0 shadow flex divide-x divide-gray-200"
            aria-label="Tabs"
          >
            <Tab as={Fragment}>
              {({ selected }) => (
                <button
                  className={cn(
                    selected
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700',

                    'group rounded-tl-lg relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10'
                  )}
                >
                  <span>Latest</span>
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

                    'group rounded-tr-lg relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10'
                  )}
                >
                  <span>Audio</span>
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
            <Tab.Panel>
              <div className="flow-root px-5">
                <ul role="list" className="divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <li key={announcement.id} className="py-5">
                      <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                        <h3 className="text-sm font-semibold text-gray-800">
                          <a
                            href="#"
                            className="hover:underline focus:outline-none"
                          >
                            {/* Extend touch target to entire panel */}
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            {announcement.title}
                          </a>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {announcement.preview}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="flow-root px-5">
                <ul role="list" className="divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <li key={announcement.id} className="py-5">
                      <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                        <h3 className="text-sm font-semibold text-gray-800">
                          <a
                            href="#"
                            className="hover:underline focus:outline-none"
                          >
                            {/* Extend touch target to entire panel */}
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            {announcement.title}
                          </a>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {announcement.preview}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <div className="flow-root px-5">
                <ul role="list" className="divide-y divide-gray-200">
                  {announcements.map((announcement) => (
                    <li key={announcement.id} className="py-5">
                      <div className="relative focus-within:ring-2 focus-within:ring-indigo-500">
                        <h3 className="text-sm font-semibold text-gray-800">
                          <a
                            href="#"
                            className="hover:underline focus:outline-none"
                          >
                            {/* Extend touch target to entire panel */}
                            <span
                              className="absolute inset-0"
                              aria-hidden="true"
                            />
                            {announcement.title}
                          </a>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {announcement.preview}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </section>
  )
}

export default ArticlesSection
