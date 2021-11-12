import { FC } from 'react'
import Image from 'next/image'
import { ClockIcon } from '@heroicons/react/outline'

const messages = [
  {
    id: 1,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
  {
    id: 2,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
  {
    id: 3,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
  {
    id: 4,
    title: 'FCS: Week 11 Games With Playoff Implications',
    time: 'November 10, 2021',
    datetime: '2021-01-27T16:35',
    imageSrc:
      'https://herosports.com/wp-content/uploads/2021/11/Ford_at_Wofford_CroppedLS-75x75.jpg',
    articleLink: '/week-11-games-with-playoffs-implications',
  },
]

const MorePosts: FC = () => {
  return (
    <div className="bg-white px-4 pb-5 shadow sm:rounded-lg sm:px-6">
      <ul role="list" className="divide-y space-y-5 divide-gray-200">
        {messages.map((message) => (
          <li
            key={message.id}
            className="relative bg-white pt-5 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600"
          >
            <div className="flex justify-between space-x-3">
              <div>
                <Image
                  alt="Image"
                  src={message.imageSrc}
                  width="75"
                  height="75"
                />
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={message.articleLink}
                  className="block focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">
                    {message.title}
                  </p>
                  <span className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500">
                    <ClockIcon className="w-3 h-3 mr-1 inline-block" />
                    <time dateTime={message.datetime}>{message.time}</time>
                  </span>
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MorePosts
