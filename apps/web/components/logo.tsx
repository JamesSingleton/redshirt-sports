import Image from 'next/image'
import Link from 'next/link'

import type { Maybe, SanityImageProps } from '@/types'

import CustomImage from './sanity-image'

const LOGO_URL =
  'https://cdn.sanity.io/images/s6kuy1ts/production/68c438f68264717e93c7ba1e85f1d0c4b58b33c2-1200x621.svg'

interface LogoProps {
  src?: Maybe<string>
  image?: Maybe<SanityImageProps>
  alt?: Maybe<string>
  width?: number
  height?: number
  priority?: boolean
}

export function Logo({
  src,
  alt = 'logo',
  image,
  width = 70,
  height = 40,
  priority = true,
}: LogoProps) {
  return (
    <Link href="/" className="">
      {image ? (
        <CustomImage
          image={image}
          width={width}
          className="h-10 w-auto"
          height={height}
          loading="eager"
          quality={100}
        />
      ) : (
        <Image
          src={src ?? LOGO_URL}
          alt={alt ?? 'logo'}
          width={width}
          className="h-10 w-auto"
          height={height}
          loading="eager"
          priority={priority}
          decoding="sync"
        />
      )}
    </Link>
  )
}
