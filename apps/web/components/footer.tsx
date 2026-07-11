import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import {
  queryFooterData,
  queryGlobalSeoSettings,
} from "@redshirt-sports/sanity/queries";
import type {
  QueryFooterDataResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import Link from "next/link";

import { sanityFetchPage } from "@/lib/sanity-fetch";
import {
  BlueSkyIcon,
  Facebook,
  Instagram,
  ThreadsIcon,
  Twitter,
  YouTubeIcon,
} from "./icons";
import { NewsletterForm } from "./newsletter-form";
import CustomImage from "./sanity-image";

interface SocialLinksProps {
  data: NonNullable<QueryGlobalSeoSettingsResult>["socialLinks"];
}

interface FooterProps {
  data: NonNullable<QueryFooterDataResult>;
  settingsData: NonNullable<QueryGlobalSeoSettingsResult>;
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
  const [response, settingsResponse] = await Promise.all([
    sanityFetchPage({
      query: queryFooterData,
      perspective,
      stega,
    }),
    sanityFetchPage({
      query: queryGlobalSeoSettings,
      perspective,
      stega,
    }),
  ]);

  if (!response?.data || !settingsResponse?.data) return <FooterSkeleton />;
  return <Footer data={response.data} settingsData={settingsResponse.data} />;
}

function SocialLinks({ data }: SocialLinksProps) {
  if (!data) return null;

  const { facebook, twitter, youtube, instagram, bluesky, threads } = data;

  const socialLinks = [
    { url: twitter, Icon: Twitter, label: "Follow us on X" },
    { url: facebook, Icon: Facebook, label: "Follow us on Facebook" },
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
  ].filter((link) => link.url);

  return (
    <ul className="flex items-center gap-4">
      {socialLinks.map(({ url, Icon, label }) => (
        <li key={label}>
          <Link
            href={url ?? "#"}
            target="_blank"
            prefetch={false}
            rel="noopener noreferrer"
            aria-label={label}
            className="text-brand-surface-muted transition-colors hover:text-brand-surface-foreground"
          >
            <Icon className="size-5 fill-current" />
            <span className="sr-only">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function FooterSkeleton() {
  return (
    <footer className="bg-brand-surface mt-16">
      <div className="border-brand-surface-border border-b">
        <div className="mx-auto max-w-[1400px] animate-pulse px-4 py-8 md:px-6">
          <div className="bg-brand-surface-border h-10 rounded" />
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
        <div className="grid animate-pulse gap-8 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="bg-brand-surface-border h-5 w-24 rounded" />
              <div className="bg-brand-surface-border h-4 w-full rounded" />
              <div className="bg-brand-surface-border h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

function Footer({ data, settingsData }: FooterProps) {
  const { subtitle, columns } = data;
  const { siteTitle, footerLogoDarkMode, footerLogo, socialLinks } =
    settingsData;
  const brandLogo = footerLogoDarkMode ?? footerLogo;
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-brand-surface text-brand-surface-foreground mt-16"
      aria-labelledby="footer-heading"
    >
      <h2 className="sr-only" id="footer-heading">
        Footer Navigation and Information
      </h2>

      {/* Newsletter strip */}
      <div className="border-brand-surface-border border-b">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:px-6">
          <div className="max-w-md">
            <h3 className="text-lg font-bold">
              {siteTitle ? `${siteTitle} Newsletter` : "Newsletter"}
            </h3>
            <p className="text-brand-surface-muted mt-1 text-sm">
              Breaking college sports news and analysis delivered to your inbox.
            </p>
          </div>
          <NewsletterForm
            className="w-full md:max-w-md"
            inputClassName="border-brand-surface-border bg-brand-surface text-brand-surface-foreground placeholder:text-brand-surface-muted focus-visible:border-primary"
            buttonClassName="bg-primary text-primary-foreground hover:bg-primary/90"
          />
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-2">
            {brandLogo ? (
              <CustomImage image={brandLogo} className="h-8 w-auto" />
            ) : null}
            {subtitle ? (
              <p className="text-brand-surface-muted mt-4 max-w-xs text-sm">
                {subtitle}
              </p>
            ) : null}
            {socialLinks ? (
              <div className="mt-6">
                <SocialLinks data={socialLinks} />
              </div>
            ) : null}
          </div>

          {Array.isArray(columns) && columns.length > 0
            ? columns.map((column) => (
                <div key={`column-${column?._key}`}>
                  <h3 className="mb-4 text-sm font-bold tracking-wide uppercase">
                    {column?.title}
                  </h3>
                  {column?.links && column.links.length > 0 ? (
                    <ul className="space-y-3">
                      {column.links.map((link) => (
                        <li key={`${link?._key}-column-${column?._key}`}>
                          <Link
                            href={link.href ?? "#"}
                            target={link.openInNewTab ? "_blank" : undefined}
                            rel={
                              link.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="text-brand-surface-muted text-sm transition-colors hover:text-brand-surface-foreground"
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            : null}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-brand-surface-border border-t">
        <div className="text-brand-surface-muted mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs md:flex-row md:px-6">
          <p>
            © {year} {siteTitle}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
