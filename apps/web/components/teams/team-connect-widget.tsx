import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
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

type SchoolSocialLinks = NonNullable<SchoolBySlugQueryResult>["socialLinks"];
type GlobalSocialLinks = NonNullable<
  QueryGlobalSeoSettingsResult
>["socialLinks"];
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
    <Card className="gap-4 py-4">
      <CardHeader className="px-4 pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        {links.map(({ url, Icon }) => {
          if (!url) return null;

          return (
            <a
              key={url}
              href={url}
              className="flex items-center gap-2 text-sm text-foreground hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon className="size-4 shrink-0" />
              <span>{socialHandle(url)}</span>
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
