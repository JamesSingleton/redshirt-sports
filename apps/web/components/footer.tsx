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
import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
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
import { ModeToggle } from "./mode-toggle";
import { SiteLogo } from "./site-logo";

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
    { url: instagram, Icon: Instagram, label: "Follow us on Instagram" },
    { url: bluesky, Icon: BlueSkyIcon, label: "Follow us on Bluesky" },
    { url: threads, Icon: ThreadsIcon, label: "Follow us on Threads" },
  ].filter((link): link is typeof link & { url: string } => Boolean(link.url));

  if (!socialLinks.length) return null;

  return (
    <ul className="flex items-center gap-2">
      {socialLinks.map(({ url, Icon, label }) => (
        <li key={url}>
          <Link
            href={url}
            target="_blank"
            prefetch={false}
            rel="noopener noreferrer"
            aria-label={label}
            className="text-header-muted hover:bg-header-accent hover:text-header-foreground flex size-9 items-center justify-center rounded-md transition-colors"
          >
            <Icon className="size-5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="bg-header mt-16 border-t-4 border-brand">
      <div className="container grid gap-10 py-12 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[1, 2, 3, 4].map((column) => (
            <div key={column} className="flex flex-col gap-3">
              <Skeleton className="h-5 w-24" />
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

function Footer({ data, settingsData, copyrightYear }: FooterProps) {
  const { subtitle, columns } = data;
  const { footerLogo, footerLogoDarkMode, socialLinks } = settingsData;
  const linkColumns = (columns ?? []).flatMap((column) => {
    const links = (column.links ?? []).filter(
      (link): link is typeof link & { href: string } => Boolean(link.href),
    );
    return links.length ? [{ ...column, links }] : [];
  });

  return (
    <footer
      className="bg-header text-header-foreground border-header-border mt-16 border-t"
      aria-labelledby="footer-heading"
    >
      <h2 className="sr-only" id="footer-heading">
        Footer navigation and information
      </h2>
      <div className="container grid gap-10 py-12 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
        <div className="flex flex-col gap-5">
          <Link href="/" aria-label="Redshirt Sports home">
            <SiteLogo
              light={footerLogo}
              dark={footerLogoDarkMode}
              className="h-7"
            />
          </Link>
          {subtitle ? (
            <p className="text-header-muted max-w-prose text-sm text-pretty">
              {subtitle}
            </p>
          ) : null}
          {socialLinks ? <SocialLinks data={socialLinks} /> : null}
        </div>
        {linkColumns.length ? (
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {linkColumns.map((column) => (
              <div key={column._key} className="flex flex-col gap-3">
                <h3 className="text-sm font-bold">{column.title}</h3>
                <ul className="flex flex-col gap-2 text-sm">
                  {column.links.map((link) => (
                    <li key={link._key}>
                      <Link
                        href={link.href}
                        className="text-header-muted hover:text-header-foreground transition-colors"
                        {...(link.openInNewTab
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : null)}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="border-header-border border-t">
        <div className="text-header-muted container flex h-14 items-center justify-between gap-4 text-xs">
          <p>© {copyrightYear} Redshirt Sports LLC. All rights reserved.</p>
          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
