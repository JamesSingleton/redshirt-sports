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
    <ul className="text-muted-foreground flex items-center space-x-6">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li
          key={`social-link-${url}-${index.toString()}`}
          className="hover:text-primary font-medium"
        >
          <Link
            href={url ?? '#'}
            target="_blank"
            prefetch={false}
            rel="noopener noreferrer"
            aria-label={label}
          >
            <Icon className="fill-muted-foreground hover:fill-primary size-6" />
            <span className="sr-only">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function FooterSkeleton() {
  return (
    <section className="mt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <footer className="h-[500px] lg:h-auto">
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
              <div>
                <span className="flex items-center justify-center gap-4 lg:justify-start">
                  <div className="bg-muted h-[40px] w-[80px] animate-pulse rounded" />
                </span>
                <div className="bg-muted mt-6 h-16 w-full animate-pulse rounded" />
              </div>
              <div className="flex items-center space-x-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-muted h-6 w-6 animate-pulse rounded" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {[1, 2, 3].map((col) => (
                <div key={col}>
                  <div className="bg-muted mb-6 h-6 w-24 animate-pulse rounded" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="bg-muted h-4 w-full animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t pt-8 text-center lg:flex-row lg:items-center lg:text-left">
            <div className="bg-muted h-4 w-48 animate-pulse rounded" />
            <div className="flex justify-center gap-4 lg:justify-start">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
            </div>
          </div>
        </footer>
      </div>
    </section>
  )
}

function Footer({ data, settingsData }: FooterProps) {
  const { subtitle, columns } = data
  const { siteTitle, footerLogo, footerLogoDarkMode, socialLinks } = settingsData

  return (
    <footer className="mt-20 pb-8" aria-labelledby="footer-heading">
      <h2 className="sr-only" id="footer-heading">
        Footer Navigation and Information
      </h2>
      <div className="container mx-auto">
        <section className="h-[500px] lg:h-auto">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-4 text-center md:px-6 lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 md:gap-8 lg:items-start">
              <div>
                <span className="flex items-center justify-center gap-4 lg:justify-start">
                  <CustomImage image={footerLogo} className="block dark:hidden" />
                  <CustomImage image={footerLogoDarkMode} className="hidden dark:block" />
                </span>
                {subtitle && (
                  <p className="text-muted-foreground mt-6 text-sm dark:text-zinc-400">
                    {subtitle}
                  </p>
                )}
              </div>
              {socialLinks && <SocialLinks data={socialLinks} />}
            </div>
            {Array.isArray(columns) && columns?.length > 0 && (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-12">
                {columns.map((column, index) => (
                  <div key={`column-${column?._key}-${index}`}>
                    <h3 className="mb-6 font-semibold">{column?.title}</h3>
                    {column?.links && column?.links?.length > 0 && (
                      <ul className="text-muted-foreground space-y-4 text-sm">
                        {column?.links?.map((link, index) => (
                          <li
                            key={`${link?._key}-${index}-column-${column?._key}`}
                            className="hover:text-primary font-medium"
                          >
                            <Link
                              href={link.href ?? '#'}
                              target={link.openInNewTab ? '_blank' : undefined}
                              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
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
          <div className="mt-20 border-t pt-8">
            <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 text-center text-sm font-normal md:px-6 lg:flex-row lg:items-center lg:text-left">
              <p>© 2025 {siteTitle}. All rights reserved.</p>
            </div>
          </div>
        </section>
      </div>
    </footer>
  )
}
