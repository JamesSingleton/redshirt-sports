import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { parseISO, format } from 'date-fns'
import { urlForImage } from '@lib/sanity'

interface AvatarProps {
  name: string
  image: string
  dateString: string
  slug: string
}
const Avatar: FC<AvatarProps> = ({ name, image, dateString, slug }) => {
  const date = parseISO(dateString)
  return (
    <div className="flex items-center space-x-5">
      <div className="flex-shrink-0">
        <div className="relative">
          <Image
            className="h-9 w-9 rounded-full"
            src={urlForImage(image).height(36).width(36).url()!}
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
          <Link href={`/authors/${slug}`}>
            <a className="font-bold text-warm-gray-900">{name}</a>
          </Link>
        </span>
        <p className="text-sm font-medium text-gray-500">
          Published on&nbsp;
          <time dateTime={dateString}>{format(date, 'LLLL	d, yyyy')}</time>
        </p>
      </div>
    </div>
  )
}

export default Avatar
