import type {
  QueryGlobalSeoSettingsResult,
  SchoolBySlugQueryResult,
} from "@redshirt-sports/sanity/types";

import {
  BlueSkyIcon,
  Facebook,
  Instagram,
  ThreadsIcon,
  Twitter,
  YouTubeIcon,
} from "@/components/icons";
import Link from "next/link";

type SchoolSocialLinks = NonNullable<SchoolBySlugQueryResult>["socialLinks"];
type GlobalSocialLinks =
  NonNullable<QueryGlobalSeoSettingsResult>["socialLinks"];
type SocialLinks = SchoolSocialLinks | GlobalSocialLinks;

function hasSocialLinks(links?: SocialLinks | null) {
  if (!links) return false;

  return Object.values(links).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

function resolveSocialLinks(
  schoolSocialLinks?: SchoolSocialLinks | null,
  globalSocialLinks?: GlobalSocialLinks | null,
) {
  if (hasSocialLinks(schoolSocialLinks)) return schoolSocialLinks;
  if (hasSocialLinks(globalSocialLinks)) return globalSocialLinks;
  return null;
}

export function socialHandle(url: string) {
  try {
    const { pathname, hostname } = new URL(url);
    const segment = pathname.split("/").filter(Boolean).at(-1);

    if (segment) {
      return segment.startsWith("@") ? segment : `@${segment}`;
    }

    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function TeamConnectWidget({
  schoolName,
  schoolSocialLinks,
  globalSocialLinks,
}: {
  schoolName?: string | null;
  schoolSocialLinks?: SchoolSocialLinks | null;
  globalSocialLinks?: GlobalSocialLinks | null;
}) {
  const usingSchoolSocialLinks = hasSocialLinks(schoolSocialLinks);
  const socialLinks = resolveSocialLinks(schoolSocialLinks, globalSocialLinks);
  if (!socialLinks) return null;

  const title =
    usingSchoolSocialLinks && schoolName
      ? `Connect With ${schoolName}`
      : "Connect With Us";

  const links = [
    { url: socialLinks.twitter, Icon: Twitter },
    { url: socialLinks.facebook, Icon: Facebook },
    { url: socialLinks.bluesky, Icon: BlueSkyIcon },
    { url: socialLinks.threads, Icon: ThreadsIcon },
    { url: socialLinks.instagram, Icon: Instagram },
    { url: socialLinks.youtube, Icon: YouTubeIcon },
  ].filter((link) => link.url);

  if (links.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <h3 className="border-b px-4 py-3 text-base font-bold">{title}</h3>
      <div className="flex flex-col px-4 py-3">
        {links.map(({ url, Icon }) => {
          if (!url) return null;

          return (
            <Link
              key={url}
              href={url}
              className="flex items-center gap-2.5 py-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="size-5 shrink-0 text-center" />
              <span>{socialHandle(url)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
