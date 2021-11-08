import { Fragment, FC } from 'react'
import cn from 'classnames'
import { Tab } from '@headlessui/react'

const latestArticles = [
  {
    title: "Huskers stick with Frost, restructure coach's deal",
    preview:
      "Scott Frost will return as Nebraska's coach in 2022 with a restructured contract, athletic director Trev Alberts announced Monday.",
  },
  {
    title: "UF's Richardson injures knee dancing at team hotel",
    preview:
      "Florida quarterback Anthony Richardson, who recently emerged as the team's starter, injured his knee while dancing at the team hotel the night before a 40-17 loss at South Carolina on Saturday.",
  },
  {
    title: 'Harbaugh: Big Ten admits to errors in MSU game',
    preview:
      "Jim Harbaugh told reporters on Monday that the Big Ten Conference acknowledged officiating mistakes in Michigan's 37-33 loss to Michigan State on Oct. 30.",
  },
]

const trendingArticles = [
  {
    title: "UW's Lake suspended 1 game for sideline incident",
    preview:
      "Washington Huskies football coach Jimmy Lake has been suspended without pay for one game after the sideline incident that involved Lake appearing to strike redshirt freshman linebacker Ruperake Fuavai's helmet during the team's 26-16 loss to Oregon on Saturday.",
  },
  {
    title: "Texas Tech hires Baylor's McGuire as head coach",
    preview:
      'Texas Tech has hired Baylor associate head coach Joey McGuire as its next head football coach.',
  },
  {
    title: 'AP poll: Cincinnati barely holds off Bama for No. 2',
    preview:
      'Cincinnati held on to the No. 2 ranking by just four points over No. 3 Alabama in The Associated Press college football poll Sunday, and Oregon passed Ohio State to move up to No. 5.',
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

                    'group rounded-tr-lg relative min-w-0 flex-1 overflow-hidden bg-white py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10'
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
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel>
              <div className="flow-root px-5">
                <ul role="list" className="divide-y divide-gray-200">
                  {latestArticles.map(({ title, preview }) => (
                    <li key={title} className="py-5">
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
                            {title}
                          </a>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {preview}
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
                  {trendingArticles.map(({ title, preview }) => (
                    <li key={title} className="py-5">
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
                            {title}
                          </a>
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {preview}
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
