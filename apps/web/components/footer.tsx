import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
} from "@redshirt-sports/sanity/live";
import {
  queryFooterData,
  queryGlobalSeoSettings,
} from "@redshirt-sports/sanity/queries";
import type {
  QueryFooterDataResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import { cacheLife } from "next/cache";
import Link from "next/link";

import {
  BlueSkyIcon,
  Facebook,
  Instagram,
  ThreadsIcon,
  Twitter,
  YouTubeIcon,
} from "./icons";
import { Logo } from "./logo";

interface SocialLinksProps {
  data: NonNullable<NonNullable<QueryGlobalSeoSettingsResult>["socialLinks"]>;
}

interface FooterProps {
  data: NonNullable<QueryFooterDataResult>;
  settingsData: NonNullable<QueryGlobalSeoSettingsResult>;
  copyrightYear: number;
}

export async function DynamicFooterServer() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedFooterServer perspective={perspective} stega={stega} />;
}

export async function CachedFooterServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const [response, settingsResponse, copyrightYear] = await Promise.all([
    sanityFetch({
      query: queryFooterData,
      perspective,
      stega,
    }),
    sanityFetch({
      query: queryGlobalSeoSettings,
      perspective,
      stega,
    }),
    getCopyrightYear(),
  ]);

  if (!response?.data || !settingsResponse?.data) return <FooterSkeleton />;
  return (
    <Footer
      data={response.data}
      settingsData={settingsResponse.data}
      copyrightYear={copyrightYear}
    />
  );
}

async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

function SocialLinks({ data }: SocialLinksProps) {
  const { facebook, twitter, youtube, instagram, bluesky, threads } = data;

  const socialLinks = [
    { url: facebook, Icon: Facebook, label: "Follow us on Facebook" },
    { url: twitter, Icon: Twitter, label: "Follow us on Twitter" },
    {
      url: youtube,
      Icon: YouTubeIcon,
      label: "Subscribe to our YouTube channel",
    },
    {
      url: instagram,
      Icon: Instagram,
      label: "Follow us on Instagram",
    },
    {
      url: bluesky,
      Icon: BlueSkyIcon,
      label: "Follow us on Bluesky",
    },
    {
      url: threads,
      Icon: ThreadsIcon,
      label: "Follow us on Threads",
    },
  ].filter((link): link is typeof link & { url: string } => Boolean(link.url));

  return (
    <ul className="text-ink-foreground/70 flex flex-wrap items-center gap-5">
      {socialLinks.map(({ url, Icon, label }, index) => (
        <li
          key={`social-link-${url}-${index.toString()}`}
          className="hover:text-primary font-medium"
        >
          <Link
            href={url}
            target="_blank"
            prefetch={false}
            rel="noopener noreferrer"
            aria-label={label}
          >
            <Icon className="fill-ink-foreground/70 hover:fill-primary size-5 transition-colors" />
            <span className="sr-only">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="bg-ink text-ink-foreground mt-16 pb-20 lg:pb-0">
      <div className="max-w-site mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-6">
        <div className="space-y-5">
          <div className="h-8 w-44 animate-pulse rounded bg-white/10" />
          <div className="h-12 w-full max-w-xs animate-pulse rounded bg-white/10" />
          <div className="flex items-center gap-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="size-5 animate-pulse rounded bg-white/10"
              />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4].map((col) => (
          <div key={col} className="space-y-4">
            <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-4 w-full animate-pulse rounded bg-white/10"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-site mx-auto px-4 py-6 lg:px-6">
          <div className="h-4 w-56 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </footer>
  );
}

function Footer({ data, settingsData, copyrightYear }: FooterProps) {
  const { subtitle, columns } = data;
  const { socialLinks } = settingsData;

  return (
    <footer
      className="bg-ink text-ink-foreground mt-16 pb-20 lg:pb-0"
      aria-labelledby="footer-heading"
    >
      <h2 className="sr-only" id="footer-heading">
        Footer Navigation and Information
      </h2>
      <div className="max-w-site mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-6">
        <div className="flex flex-col items-start gap-6">
          <div>
            <Logo variant="ink" />
            {subtitle && (
              <p className="text-ink-foreground/70 mt-4 max-w-sm text-sm leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {socialLinks && <SocialLinks data={socialLinks} />}
        </div>
        {Array.isArray(columns) &&
          columns.length > 0 &&
          columns.map((column) => (
            <div key={`column-${column?._key}`}>
              <h3 className="kicker text-ink-foreground/60 mb-3">
                {column?.title}
              </h3>
              {column?.links && column.links.length > 0 && (
                <ul className="space-y-2.5 text-sm">
                  {column.links.map((link) => (
                    <li key={`${link?._key}-column-${column?._key}`}>
                      <Link
                        href={link.href ?? "#"}
                        target={link.openInNewTab ? "_blank" : undefined}
                        rel={
                          link.openInNewTab ? "noopener noreferrer" : undefined
                        }
                        className="text-ink-foreground/85 hover:text-primary font-medium transition-colors"
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
      <div className="border-t border-white/10">
        <div className="text-ink-foreground/60 max-w-site mx-auto flex flex-col justify-between gap-2 px-4 py-6 text-xs lg:flex-row lg:items-center lg:px-6">
          <p>© {copyrightYear} Redshirt Sports LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
