import Link from 'next/link'

import { sanityFetch } from '@redshirt-sports/sanity/live'
import { queryFooterData, queryGlobalSeoSettings } from '@redshirt-sports/sanity/queries'
import type {
  QueryFooterDataResult,
  QueryGlobalSeoSettingsResult,
} from '@redshirt-sports/sanity/types'
import { BlueSkyIcon, Facebook, Instagram, ThreadsIcon, Twitter, YouTubeIcon } from './icons'
import CustomImage from './sanity-image'

interface SocialLinksProps {
  data: NonNullable<QueryGlobalSeoSettingsResult>['socialLinks']
}

interface FooterProps {
  data: NonNullable<QueryFooterDataResult>
  settingsData: NonNullable<QueryGlobalSeoSettingsResult>
}

export async function FooterServer() {
  const [response, settingsResponse] = await Promise.all([
    sanityFetch({
      query: queryFooterData,
    }),
    sanityFetch({
      query: queryGlobalSeoSettings,
    }),
  ])

  if (!response?.data || !settingsResponse?.data) return <FooterSkeleton />
  return <Footer data={response.data} settingsData={settingsResponse.data} />
}

function SocialLinks({ data }: SocialLinksProps) {
  if (!data) return null

  const { facebook, twitter, youtube, instagram, bluesky, threads } = data

  const socialLinks = [
    { url: facebook, Icon: Facebook, label: 'Follow us on Facebook' },
    { url: twitter, Icon: Twitter, label: 'Follow us on Twitter' },
    {
      url: youtube,
      Icon: YouTubeIcon,
      label: 'Subscribe to our YouTube channel',
    },
    {
      url: instagram,
      Icon: Instagram,
      label: 'Follow us on Instagram',
    },
    {
      url: bluesky,
      Icon: BlueSkyIcon,
      label: 'Follow us on Bluesky',
    },
    {
      url: threads,
      Icon: ThreadsIcon,
      label: 'Follow us on Threads',
    },
  ].filter((link) => link.url)

  return (
    <ul className="flex items-center gap-4">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li key={`social-link-${url}-${index.toString()}`}>
          <Link
            href={url ?? '#'}
            target="_blank"
            prefetch={false}
            rel="noopener noreferrer"
            aria-label={label}
            className="flex items-center justify-center rounded-full bg-gray-800 p-2 transition-colors hover:bg-primary"
          >
            <Icon className="size-4 fill-gray-300" />
            <span className="sr-only">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function FooterSkeleton() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="container py-12">
        <div className="flex flex-col items-center justify-between gap-10 lg:flex-row lg:items-start">
          <div className="flex w-full max-w-80 flex-col items-center gap-6 lg:items-start">
            <div className="h-10 w-40 animate-pulse rounded bg-gray-800" />
            <div className="h-16 w-full animate-pulse rounded bg-gray-800" />
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-8 animate-pulse rounded-full bg-gray-800" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            {[1, 2, 3].map((col) => (
              <div key={col}>
                <div className="mb-4 h-5 w-24 animate-pulse rounded bg-gray-800" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-4 w-full animate-pulse rounded bg-gray-800" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function Footer({ data, settingsData }: FooterProps) {
  const { subtitle, columns } = data
  const { siteTitle, footerLogo, footerLogoDarkMode, socialLinks } = settingsData

  return (
    <footer className="bg-gray-950 text-gray-300" aria-labelledby="footer-heading">
      <h2 className="sr-only" id="footer-heading">
        Footer Navigation and Information
      </h2>

      <div className="container py-12 lg:py-16">
        <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:items-start lg:text-left">
          {/* Brand column */}
          <div className="flex w-full max-w-80 flex-shrink-0 flex-col items-center gap-6 lg:items-start">
            <span className="flex items-center justify-center gap-4 lg:justify-start">
              <CustomImage image={footerLogo} className="block brightness-0 invert dark:hidden" />
              <CustomImage image={footerLogoDarkMode} className="hidden dark:block" />
            </span>
            {subtitle && (
              <p className="text-sm leading-relaxed text-gray-400">{subtitle}</p>
            )}
            {socialLinks && <SocialLinks data={socialLinks} />}
          </div>

          {/* Link columns */}
          {Array.isArray(columns) && columns?.length > 0 && (
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
              {columns.map((column, index) => (
                <div key={`column-${column?._key}-${index}`}>
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">
                    {column?.title}
                  </h3>
                  {column?.links && column?.links?.length > 0 && (
                    <ul className="space-y-3 text-sm">
                      {column?.links?.map((link, linkIndex) => (
                        <li key={`${link?._key}-${linkIndex}-column-${column?._key}`}>
                          <Link
                            href={link.href ?? '#'}
                            target={link.openInNewTab ? '_blank' : undefined}
                            rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                            className="text-gray-400 transition-colors hover:text-white"
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-gray-500 lg:flex-row lg:text-left">
            <p>{'(c)'} {new Date().getFullYear()} {siteTitle}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
