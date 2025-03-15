import Link from 'next/link';

import { sanityFetch } from '@/lib/sanity/live';
import { queryFooterData } from '@/lib/sanity/query';
import {Facebook, Twitter, YouTubeIcon} from './icons'
import Image from 'next/image';

async function fetchFooterData() {
  const response = await sanityFetch({
    query: queryFooterData,
  });
  return response;
}

export async function FooterServer() {
  const footerData = await fetchFooterData();
  if (!footerData?.data) return <FooterSkeleton />;
  return <Footer data={footerData.data} />;
}

function SocialLinks({ data }: SocialLinksProps) {
  if (!data) return null;

  const { facebook, twitter, youtube } = data;

  const socialLinks = [
    { url: facebook, Icon: Facebook, label: "Follow us on Facebook" },
    { url: twitter, Icon: Twitter, label: "Follow us on Twitter" },
    {
      url: youtube,
      Icon: YouTubeIcon,
      label: "Subscribe to our YouTube channel",
    },
  ].filter((link) => link.url);

  return (
    <ul className="flex items-center space-x-6 text-muted-foreground">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li
          key={`social-link-${url}-${index.toString()}`}
          className="font-medium hover:text-primary"
        >
          <Link
            href={url ?? "#"}
            target="_blank"
            prefetch={false}
            rel="noopener noreferrer"
            aria-label={label}
          >
            <Icon className="fill-muted-foreground hover:fill-primary/80 dark:fill-zinc-400 dark:hover:fill-primary size-6" />
            <span className="sr-only">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
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
                  <div className="h-[40px] w-[80px] bg-muted rounded animate-pulse" />
                </span>
                <div className="mt-6 h-16 w-full bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center space-x-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-6 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {[1, 2, 3].map((col) => (
                <div key={col}>
                  <div className="mb-6 h-6 w-24 bg-muted rounded animate-pulse" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-4 w-full bg-muted rounded animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex flex-col justify-between gap-4 border-t pt-8 text-center lg:flex-row lg:items-center lg:text-left">
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            <div className="flex justify-center gap-4 lg:justify-start">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

export function Footer({ data }: FooterProps) {
  const { subtitle, columns, socialLinks, logo, siteTitle } = data;
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 pb-8 container mx-auto h-[500px] lg:h-auto">
      <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 md:gap-8 lg:items-start">
          <div>
            <span className="flex items-center justify-center gap-4 lg:justify-start">
              {/* <Logo src={logo} alt={siteTitle} priority /> */}
              <Image src={logo} alt={siteTitle} height={40} width={170} />
            </span>
            {subtitle && (
              <p className="mt-6 text-sm text-muted-foreground dark:text-zinc-400">
                {subtitle}
              </p>
            )}
          </div>
          {socialLinks && <SocialLinks data={socialLinks} />}
        </div>
        {Array.isArray(columns) && columns?.length > 0 && (
          <div className="grid grid-cols-3 gap-6 lg:gap-28 lg:mr-20">
            {columns.map((column, index) => (
              <div key={`column-${column?._key}-${index}`}>
                <h3 className="mb-6 font-semibold">{column?.title}</h3>
                {column?.links && column?.links?.length > 0 && (
                  <ul className="space-y-4 text-sm text-muted-foreground dark:text-zinc-400">
                    {column?.links?.map((link, index) =>  {
                      let basePath: string
                      if (column?.title === 'Football') {
                        basePath = `/college/football/news/`
                      }
                      return (
                        <li
                          key={`${link?._key}-${index}-column-${column?._key}`}
                          className="font-medium hover:text-primary"
                        >
                          <Link
                            href={link.href}
                            target={link.openInNewTab ? "_blank" : undefined}
                            rel={
                              link.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                          >
                            {link.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-20 border-t pt-8">
        <div className="flex flex-col justify-between gap-4  text-center text-sm font-normal text-muted-foreground lg:flex-row lg:items-center lg:text-left mx-auto max-w-7xl px-4 md:px-6">
          <p>
            © {year} {siteTitle}. All rights reserved.
          </p>
          <ul className="flex justify-center gap-4 lg:justify-start">
            <li className="hover:text-primary">
              <Link href="/terms">Terms and Conditions</Link>
            </li>
            <li className="hover:text-primary">
              <Link href="/privacy">Privacy Policy</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}