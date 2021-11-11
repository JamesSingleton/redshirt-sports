import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface AvatarProps {
  name: string
  picture: string
  date: string
}
const Avatar: FC<AvatarProps> = ({ name, picture, date }) => {
  return (
    <div className="flex items-center space-x-5">
      <div className="flex-shrink-0">
        <div className="relative">
          <Image
            className="h-9 w-9 rounded-full"
            src={picture}
            alt={name}
            width="36"
            height="36"
          />
          <span
            className="absolute inset-0 shadow-inner rounded-full"
            aria-hidden="true"
          />
        </div>
      </div>
      <div>
        <span>
          By&nbsp;
          <Link href="/authors/james-singleton">
            <a className="font-bold text-warm-gray-900">{name}</a>
          </Link>
        </span>
        <p className="text-sm font-medium text-gray-500">
          Published on&nbsp;
          <time dateTime={date}>{date}</time>
        </p>
      </div>
    </div>
  )
}

export default Avatar
