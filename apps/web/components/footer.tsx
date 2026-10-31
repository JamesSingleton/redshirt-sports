import {
  cachedSanity,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { queryFooterData } from "@redshirt-sports/sanity/queries";
import type {
  QueryFooterDataResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import Link from "next/link";

import { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";
import { CopyrightYear } from "./copyright-year";
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
}

export async function DynamicFooterServer() {
  return <CachedFooterServer {...(await resolveDynamicFetchOptions())} />;
}

export async function CachedFooterServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  return CachedFooterBody({ perspective, stega });
}

async function CachedFooterBody({ perspective, stega }: DynamicFetchOptions) {
  const [response, settingsData] = await Promise.all([
    cachedSanity({
      query: queryFooterData,
      perspective,
      stega,
    }),
    fetchGlobalSeoSettings(perspective),
  ]);

  if (!response?.data || !settingsData) return <FooterSkeleton />;
  return <Footer data={response.data} settingsData={settingsData} />;
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
    <ul className="flex items-center space-x-6 text-ink-foreground/70">
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
            <Icon className="fill-muted-foreground hover:fill-primary size-6" />
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
                  <div className="bg-muted h-[40px] w-[80px] animate-pulse rounded" />
                </span>
                <div className="bg-muted mt-6 h-16 w-full animate-pulse rounded" />
              </div>
              <div className="flex items-center space-x-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="bg-muted h-6 w-6 animate-pulse rounded"
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              {[1, 2, 3].map((col) => (
                <div key={col}>
                  <div className="bg-muted mb-6 h-6 w-24 animate-pulse rounded" />
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="bg-muted h-4 w-full animate-pulse rounded"
                      />
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
  );
}

function Footer({ data, settingsData }: FooterProps) {
  const { subtitle, columns } = data;
  const { logo, footerLogo, footerLogoDarkMode, socialLinks, siteBrand } =
    settingsData;
  const brand = siteBrand ?? "Redshirt Sports";

  return (
    <footer
      className="mt-16 bg-ink text-ink-foreground pb-20 lg:pb-0"
      aria-labelledby="footer-heading"
    >
      <h2 className="sr-only" id="footer-heading">
        Footer Navigation and Information
      </h2>
      <div className="mx-auto grid max-w-site gap-10 px-4 py-12 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:px-6">
        <div>
          <Logo
            alt={brand}
            image={logo}
            footerLogo={footerLogo}
            footerLogoDarkMode={footerLogoDarkMode}
            variant="footer"
            priority={false}
          />
          {subtitle ? (
            <p className="mt-3 max-w-xs text-sm text-ink-foreground/70">
              {subtitle}
            </p>
          ) : null}
          {socialLinks ? (
            <div className="mt-6">
              <SocialLinks data={socialLinks} />
            </div>
          ) : null}
        </div>
        {Array.isArray(columns) &&
          columns.map((column) => (
            <div key={`column-${column?._key}`}>
              <div className="kicker mb-3 text-ink-foreground/60">
                {column?.title}
              </div>
              {column?.links && column.links.length > 0 ? (
                <ul className="grid gap-2 text-sm">
                  {column.links.map((link) => (
                    <li key={`${link?._key}-column-${column?._key}`}>
                      <Link
                        href={link.href ?? "#"}
                        className="hover:underline"
                        target={link.openInNewTab ? "_blank" : undefined}
                        rel={
                          link.openInNewTab ? "noopener noreferrer" : undefined
                        }
                        prefetch={false}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
      </div>
      <div className="border-t border-ink-foreground/10">
        <p className="mx-auto max-w-site px-4 py-6 text-center text-sm text-ink-foreground/70 lg:px-6 lg:text-left">
          ©{" "}
          <span suppressHydrationWarning>
            <CopyrightYear />
          </span>{" "}
          Redshirt Sports LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
