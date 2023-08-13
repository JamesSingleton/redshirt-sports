import Link from 'next/link'
import { Mail, Globe } from 'lucide-react'

import {
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
  Instagram,
  Twitter,
  Facebook,
} from '@components/common/icons'
import { ImageComponent } from '@components/ui'

import type { Author } from '@types'

const Author = (author: Author) => {
  return (
    <div className="lg:sticky lg:left-0 lg:top-24 lg:mt-12 lg:self-start">
      <div className="flex flex-row lg:flex-col">
        {author.archived ? (
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-full">
            <ImageComponent
              image={author.image}
              alt={author.name}
              className="h-full w-full object-cover"
              width={96}
              height={96}
            />
          </div>
        ) : (
          <Link
            href={`/authors/${author.slug}`}
            className="mb-4 h-24 w-24 overflow-hidden rounded-full"
          >
            <ImageComponent
              image={author.image}
              alt={author.name}
              className="h-full w-full object-cover"
              width={96}
              height={96}
            />
          </Link>
        )}
        <div className="ml-4 lg:ml-0">
          {author.archived ? (
            <p className="text-xl font-bold">{author.name}</p>
          ) : (
            <>
              <Link href={`/authors/${author.slug}`} className="mt-5 text-xl font-bold">
                {author.name}
              </Link>
              <p className="mt-4 text-base font-normal">{author.role}</p>
            </>
          )}
        </div>
      </div>
      {!author.archived && author.socialMedia && (
        <ul className="hidden lg:mt-8 lg:flex lg:items-center lg:gap-3">
          {author.socialMedia.map((social) => (
            <li key={social._key} className="group">
              <a
                href={social.url}
                target="_blank"
                rel="noopener"
                title={`Follow ${author.name} on ${social.name}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary transition-all duration-200 group-hover:bg-primary"
              >
                <span className="sr-only">{`Follow ${author.name} on ${social.name}`}</span>
                {social.name === 'Email' ? (
                  <Mail className="h-6 w-6 group-hover:text-secondary" />
                ) : null}
                {social.name === 'Twitter' ? (
                  <Twitter className="h-6 w-6 group-hover:fill-secondary group-hover:text-secondary" />
                ) : null}
                {social.name === 'Facebook' ? (
                  <Facebook className="h-6 w-6 group-hover:fill-secondary group-hover:text-secondary" />
                ) : null}
                {social.name === 'Instagram' ? (
                  <Instagram className="h-6 w-6 group-hover:fill-secondary group-hover:text-secondary" />
                ) : null}
                {social.name === 'Website' ? (
                  <Globe className="h-6 w-6 group-hover:text-secondary" />
                ) : null}
                {social.name === 'Spotify Podcast' ? (
                  <SpotifyIcon className="h-6 w-6 group-hover:fill-secondary group-hover:text-secondary" />
                ) : null}
                {social.name === 'Apple Podcast' ? (
                  <ApplePodcastIcon className="h-6 w-6 group-hover:fill-secondary group-hover:text-secondary" />
                ) : null}
                {social.name === 'Overcast Podcast' ? (
                  <OvercastIcon className="h-6 w-6 group-hover:fill-secondary group-hover:text-secondary" />
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Author
