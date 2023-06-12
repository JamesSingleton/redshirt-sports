import Link from 'next/link'
import Image from 'next/image'
import { EnvelopeOpenIcon, GlobeAltIcon, HomeIcon } from '@heroicons/react/24/solid'

import { urlForImage } from '@lib/sanity.image'
import {
  Instagram,
  Twitter,
  Facebook,
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
} from '@components/common/icons'

import type { Author } from '@types'

const Author = (author: Author) => {
  return (
    <div className="lg:sticky lg:left-0 lg:top-24 lg:mt-12 lg:self-start">
      <div className="flex flex-row lg:flex-col">
        <Link
          href={`/authors/${author.slug}`}
          className="mb-4 block h-24 w-24 overflow-hidden rounded-full"
        >
          <Image
            src={urlForImage(author.image).url()}
            alt={author.name}
            width={96}
            height={96}
            className="h-full w-full object-cover"
            title={author.name}
          />
        </Link>
        <div className="ml-4 lg:ml-0">
          <Link href={`/authors/${author.slug}`} className="mt-5 text-xl font-bold">
            {author.name}
          </Link>
          <p className="mt-4 text-base font-normal">{author.role}</p>
        </div>
      </div>
      {author.socialMedia && (
        <ul className="hidden lg:mt-8 lg:flex lg:items-center lg:gap-3">
          {author.socialMedia.map((social) => (
            <li key={social._key}>
              <a
                href={social.url}
                target="_blank"
                rel="noopener"
                title={`Follow ${author.name} on ${social.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all duration-200"
              >
                <span className="sr-only">{`Follow ${author.name} on ${social.name}`}</span>
                {social.name === 'Email' ? <EnvelopeOpenIcon className="h-6 w-6" /> : null}
                {social.name === 'Twitter' ? <Twitter className="h-6 w-6" /> : null}
                {social.name === 'Facebook' ? <Facebook className="h-6 w-6" /> : null}
                {social.name === 'Instagram' ? <Instagram className="h-6 w-6" /> : null}
                {social.name === 'Website' ? <GlobeAltIcon className="h-6 w-6" /> : null}
                {social.name === 'Spotify Podcast' ? <SpotifyIcon className="h-6 w-6" /> : null}
                {social.name === 'Apple Podcast' ? <ApplePodcastIcon className="h-6 w-6" /> : null}
                {social.name === 'Overcast Podcast' ? <OvercastIcon className="h-6 w-6" /> : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Author
