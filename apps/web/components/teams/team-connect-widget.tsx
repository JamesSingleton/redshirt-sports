import type {
  QueryGlobalSeoSettingsResult,
  SchoolBySlugQueryResult,
} from "@redshirt-sports/sanity/types";
import Link from "next/link";

import {
  BlueSkyIcon,
  Facebook,
  Instagram,
  ThreadsIcon,
  Twitter,
  YouTubeIcon,
} from "@/components/icons";
import { SidebarCard } from "@/components/sidebar-card";

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
      ? `Follow ${schoolName}`
      : "Follow Redshirt Sports";

  const links = [
    { url: socialLinks.twitter, Icon: Twitter },
    { url: socialLinks.facebook, Icon: Facebook },
    { url: socialLinks.bluesky, Icon: BlueSkyIcon },
    { url: socialLinks.threads, Icon: ThreadsIcon },
    { url: socialLinks.instagram, Icon: Instagram },
    { url: socialLinks.youtube, Icon: YouTubeIcon },
  ].filter((link): link is typeof link & { url: string } => Boolean(link.url));

  if (links.length === 0) return null;

  return (
    <SidebarCard.Root labelledBy="team-connect-heading">
      <SidebarCard.Header id="team-connect-heading" title={title} />
      <ul className="divide-y">
        {links.map(({ url, Icon }) => (
          <li key={url}>
            <Link
              href={url}
              className="hover:bg-accent flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{socialHandle(url)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </SidebarCard.Root>
  );
}
