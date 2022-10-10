import Link from 'next/link'
import { usePlausible } from 'next-plausible'

import { BlurImage } from '@components/ui'
import { urlForImage, PortableTextComponent } from '@lib/sanity'
import {
  Instagram,
  Twitter,
  Facebook,
  Website,
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
} from '@components/common/icons'

import { Author } from '@types'

interface PostFooterProps {
  title: string
  slug: string
  author: Author
}

const PostFooter = ({ title, slug, author }: PostFooterProps) => {
  const plausible = usePlausible()

  return (
    <footer className="mx-auto mt-12 max-w-prose divide-y text-lg sm:mt-14">
      <div className="py-8 sm:py-10">
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-slate-900">Share</span>
          <ul className="flex items-center space-x-3">
            <li>
              <a
                onClick={() =>
                  plausible('ShareArticle', {
                    props: {
                      item: 'Facebook',
                    },
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  title
                )}&url=https://www.redshirtsports.xyz/${slug}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 transition duration-300 ease-in-out sm:h-12 sm:w-12"
                title="Share article on Twitter"
              >
                <span className="sr-only">Share article on Twitter</span>
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transform text-slate-700 transition duration-300 ease-in-out"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  plausible('ShareArticle', {
                    props: {
                      item: 'Facebook',
                    },
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.facebook.com/sharer.php?u=https://www.redshirtsports.xyz/${slug}&quote=${encodeURIComponent(
                  title
                )}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 transition duration-300 ease-in-out sm:h-12 sm:w-12"
                title="Share article on Facebook"
              >
                <span className="sr-only">Share article on Facebook</span>
                <svg
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 transform text-slate-700 transition duration-300 ease-in-out"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="py-8 sm:py-10">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col sm:flex-row">
            <div className="shrink-0">
              <Link href={`/authors/${author.slug}`} prefetch={false}>
                <a
                  onClick={() => plausible('clickOnAuthor')}
                  className="relative block h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-24"
                >
                  <BlurImage
                    alt={author.name}
                    src={urlForImage(author.image).width(100).height(100).url()}
                    blurDataURL={author.image.asset.metadata.lqip ?? undefined}
                    layout="responsive"
                    className="rounded-2xl"
                    width={96}
                    height={96}
                  />
                </a>
              </Link>
            </div>
            <div className="mt-5 text-left sm:ml-6 sm:mt-0">
              <div className="flex items-center justify-between">
                <Link href={`/authors/${author.slug}`} prefetch={false}>
                  <a onClick={() => plausible('clickOnAuthor')} className="flex-col">
                    <span className="block text-sm uppercase tracking-widest text-brand-500">
                      {author.role}
                    </span>
                    <span className="mt-1 text-xl font-medium tracking-normal text-slate-900 md:tracking-tight lg:leading-tight">
                      {author.name}
                    </span>
                  </a>
                </Link>
              </div>
              <div className="mt-3 text-base leading-loose text-slate-500 line-clamp-3">
                <PortableTextComponent value={author.bio} />
              </div>
              <ul className="mt-3 flex items-center space-x-3">
                {author.socialMedia &&
                  author.socialMedia.map((social) => (
                    <li key={social._key}>
                      <a
                        onClick={() =>
                          plausible('clickOnAuthorSocialMedia', {
                            props: {
                              item: social.name,
                              url: social.url,
                            },
                          })
                        }
                        href={social.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group"
                      >
                        <span className="sr-only">{`${author.name}'s ${social.name}`}</span>
                        {social.name === 'Twitter' ? (
                          <Twitter className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Facebook' ? (
                          <Facebook className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Instagram' ? (
                          <Instagram className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Website' ? (
                          <Website className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Spotify Podcast' ? (
                          <SpotifyIcon className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Apple Podcast' ? (
                          <ApplePodcastIcon className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Overcast Podcast' ? (
                          <OvercastIcon className="h-8 w-8 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default PostFooter
