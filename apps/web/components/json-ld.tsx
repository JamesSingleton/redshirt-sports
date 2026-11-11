import { urlFor } from "@redshirt-sports/sanity/client";
import {
  cachedSanity,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { querySettingsData } from "@redshirt-sports/sanity/queries";
import { storySchemaType } from "@redshirt-sports/sanity/story-types";
import { toPlainText } from "next-sanity";
import type {
  BreadcrumbList,
  ContactPoint,
  Graph,
  ImageObject,
  NewsArticle,
  Organization,
  SportsTeam,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

import {
  type ArticleAuthorInput,
  type ArticleEntityInput,
  buildArticleAbout,
  buildArticleAuthor,
  buildArticleCorrections,
  buildArticleMentions,
} from "@/lib/article-entities";
import { getArticleTagNames } from "@/lib/article-seo";
import { getBaseUrl } from "@/lib/get-base-url";
import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";
import { sportNavLabel } from "@/lib/sport-nav";
import { getCollegeSportSection } from "@/lib/sport-section";

const baseUrl = getBaseUrl();

export const organizationId = `${baseUrl}/#organization`;
export const websiteId = `${baseUrl}/#website`;

type PostArticle = ArticleEntityInput & {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  /** Editor-set time of the last substantive update. */
  modifiedAt?: string | null;
  _updatedAt?: string | null;
  body?: unknown;
  authors?: ArticleAuthorInput[] | null;
  image?: {
    alt?: string | null;
    asset?: { _ref?: string };
  } | null;
  sport?: { slug?: string | null; title?: string | null } | null;
  editorsNote?: string | null;
  storyType?: string | null;
  tags?: Array<{ name?: string | null } | null> | null;
};

type TeamSchool = {
  slug?: string | null;
  name?: string | null;
  shortName?: string | null;
  nickname?: string | null;
  websiteUrl?: string | null;
  socialLinks?: Record<string, string | null | undefined> | null;
  image?: {
    alt?: string | null;
    asset?: { _ref?: string };
  } | null;
  conferenceAffiliations?: Array<{
    sport?: { title?: string | null } | null;
    conference?: { name?: string | null; shortName?: string | null } | null;
  } | null> | null;
};

type PublisherSettings = {
  siteBrand?: string | null;
  logo?: string | null;
};

export function JsonLdScript<T>({ data, id }: { data: T; id: string }) {
  return (
    <script type="application/ld+json" id={id}>
      {JSON.stringify(data, null, 0)}
    </script>
  );
}

/** 16:9 at the dimensions declared in JSON-LD (1920x1080). */
export function buildSafeImageUrl(
  image?: { asset?: { _ref?: string } } | null,
) {
  if (!image?.asset?._ref) {
    return undefined;
  }
  return buildCroppedImageUrl(image, 1920, 1080);
}

type ImageWithAsset = { asset?: { _ref?: string } };

function buildCroppedImageUrl(
  image: ImageWithAsset,
  width: number,
  height: number,
): string {
  return urlFor({ ...image, _id: image.asset?._ref })
    .size(width, height)
    .auto("format")
    .quality(80)
    .url();
}

/**
 * Logos keep their own aspect ratio (no crop) and are served as PNG so
 * Google can read them as a publisher or team logo.
 */
export function buildLogoUrl(image?: { asset?: { _ref?: string } } | null) {
  if (!image?.asset?._ref) {
    return undefined;
  }
  return urlFor({ ...image, _id: image.asset?._ref })
    .width(512)
    .fit("max")
    .format("png")
    .url();
}

function buildImageObject({
  imageUrl,
  alt,
  id,
  width = 1920,
  height = 1080,
}: {
  imageUrl: string;
  alt?: string | null;
  id?: string;
  width?: number;
  height?: number;
}): ImageObject {
  return {
    "@type": "ImageObject",
    ...(id ? { "@id": id } : {}),
    url: imageUrl,
    contentUrl: imageUrl,
    caption: alt ?? undefined,
    width: String(width),
    height: String(height),
  } as ImageObject;
}

function buildPublisher({
  siteBrand,
  logo,
}: PublisherSettings = {}): Organization {
  return {
    "@type": "Organization",
    "@id": organizationId,
    name: siteBrand || "Redshirt Sports",
    ...(logo
      ? {
          logo: {
            "@type": "ImageObject",
            url: logo,
          } as ImageObject,
        }
      : {}),
  } as Organization;
}

export function buildPostPageJsonLd(
  article: PostArticle,
  publisher: PublisherSettings = {},
) {
  if (!article?.slug) {
    return null;
  }

  const resolvedBaseUrl = getBaseUrl();
  const articleUrl = `${resolvedBaseUrl}/${article.slug}`;
  const breadcrumbId = `${articleUrl}#breadcrumb`;
  const articleId = `${articleUrl}#article`;
  const imageId = `${articleUrl}#primaryImage`;
  const plainText = toPlainText(
    (article.body ?? []) as Parameters<typeof toPlainText>[0],
  );
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const imageUrl = buildSafeImageUrl(article.image ?? undefined);
  // Google's Article docs recommend 16:9, 4:3 and 1:1 versions of the image.
  // They share the hero's asset, so they exist exactly when imageUrl does.
  const extraImageSizes = [
    { width: 1200, height: 900 },
    { width: 1200, height: 1200 },
  ];
  const articleSection = getCollegeSportSection(article.sport);
  const tagNames = getArticleTagNames(article.tags);
  const pageName = article.title
    ? `${article.title} | ${publisher.siteBrand || "Redshirt Sports"}`
    : undefined;

  const breadcrumbCrumbs = [
    { name: "Home", item: resolvedBaseUrl },
    ...(article.sport?.slug
      ? [
          {
            name: sportNavLabel(
              article.sport.slug,
              article.sport.title ?? article.sport.slug,
            ),
            item: `${resolvedBaseUrl}/college/${article.sport.slug}/news`,
          },
        ]
      : []),
    { name: article.title ?? "Article", item: articleUrl },
  ];

  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    name: article.title
      ? `${article.title} breadcrumbs`
      : "Article breadcrumbs",
    itemListElement: breadcrumbCrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.item,
    })),
  };

  const webPage: WebPage = {
    "@type": "WebPage",
    "@id": articleUrl,
    url: articleUrl,
    name: pageName,
    isPartOf: { "@id": websiteId },
    ...(imageUrl
      ? {
          primaryImageOfPage: {
            "@id": imageId,
          },
          thumbnailUrl: imageUrl,
        }
      : {}),
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.modifiedAt ?? article.publishedAt ?? undefined,
    description: article.excerpt ?? undefined,
    breadcrumb: { "@id": breadcrumbId },
    mainEntity: { "@id": articleId },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["#article-title", "#article-excerpt"],
    },
    inLanguage: "en-US",
    potentialAction: [
      {
        "@type": "ReadAction",
        target: [articleUrl],
      },
    ],
  };

  const about = buildArticleAbout(article, resolvedBaseUrl);
  const mentions = buildArticleMentions(article);
  const corrections = buildArticleCorrections(article);

  const newsArticle: NewsArticle = {
    // The format's NewsArticle subtype: reporting, analysis, opinion, or background.
    "@type": storySchemaType(article.storyType) as "NewsArticle",
    "@id": articleId,
    isPartOf: { "@id": websiteId },
    author: (article.authors ?? [])
      .filter(Boolean)
      .map((author) => buildArticleAuthor(author, resolvedBaseUrl)),
    headline: article.title ?? undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.modifiedAt ?? article.publishedAt ?? undefined,
    description: article.excerpt ?? undefined,
    mainEntityOfPage: { "@id": articleUrl },
    wordCount,
    publisher: buildPublisher(publisher),
    ...(imageUrl
      ? {
          image: [
            buildImageObject({
              imageUrl,
              alt: article.image?.alt,
              id: imageId,
            }),
            ...extraImageSizes.map(({ width, height }) =>
              buildImageObject({
                // imageUrl is only set when article.image has an asset.
                imageUrl: buildCroppedImageUrl(
                  article.image as ImageWithAsset,
                  width,
                  height,
                ),
                alt: article.image?.alt,
                width,
                height,
              }),
            ),
          ],
          thumbnailUrl: imageUrl,
        }
      : {}),
    url: articleUrl,
    inLanguage: "en-US",
    ...(articleSection ? { articleSection } : {}),
    ...(tagNames.length > 0 ? { keywords: tagNames.join(", ") } : {}),
    ...(about.length > 0 ? { about } : {}),
    ...(mentions.length > 0 ? { mentions } : {}),
    ...(corrections.length > 0 ? { correction: corrections } : {}),
    ...(article.editorsNote ? { backstory: article.editorsNote } : {}),
    ...(article.publishedAt
      ? { copyrightYear: new Date(article.publishedAt).getFullYear() }
      : {}),
    copyrightHolder: { "@id": organizationId },
    potentialAction: [
      {
        "@type": "ReadAction",
        target: [articleUrl],
      },
    ],
  };

  const graph: Graph["@graph"] = [
    breadcrumb,
    webPage,
    newsArticle,
    ...(imageUrl
      ? [
          buildImageObject({
            imageUrl,
            alt: article.image?.alt,
            id: imageId,
          }),
        ]
      : []),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  } satisfies Graph;
}

export function PostPageJsonLd({
  article,
  publisher,
}: {
  article: PostArticle | null | undefined;
  publisher?: PublisherSettings;
}) {
  if (!article) {
    return null;
  }

  const data = buildPostPageJsonLd(article, publisher);
  if (!data) {
    return null;
  }

  return <JsonLdScript data={data} id={`article-json-ld-${article.slug}`} />;
}

export function buildTeamPageJsonLd(school: TeamSchool) {
  if (!school.slug) {
    return null;
  }

  const resolvedBaseUrl = getBaseUrl();
  const teamUrl = `${resolvedBaseUrl}/college/teams/${school.slug}`;
  const teamName = [school.shortName ?? school.name, school.nickname]
    .filter(Boolean)
    .join(" ");
  const logoUrl = buildLogoUrl(school.image ?? undefined);
  const sports =
    school.conferenceAffiliations
      ?.map((affiliation) => affiliation?.sport?.title)
      .filter((title): title is string => Boolean(title)) ?? [];
  const conferences =
    school.conferenceAffiliations
      ?.map(
        (affiliation) =>
          affiliation?.conference?.shortName ?? affiliation?.conference?.name,
      )
      .filter((name): name is string => Boolean(name)) ?? [];
  const sameAs = [
    school.websiteUrl,
    ...Object.values(school.socialLinks ?? {}),
  ].filter((url): url is string => Boolean(url));

  const sportsTeam: SportsTeam = {
    "@type": "SportsTeam",
    "@id": `${teamUrl}#team`,
    name: teamName || school.name || undefined,
    url: teamUrl,
    ...(logoUrl ? { logo: logoUrl } : {}),
    ...(sports.length > 0
      ? { sport: sports.length === 1 ? sports[0] : sports }
      : {}),
    ...(conferences.length > 0
      ? {
          memberOf: conferences.map((name) => ({
            "@type": "SportsOrganization",
            name,
          })),
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": `${teamUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: resolvedBaseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Teams",
        item: `${resolvedBaseUrl}/college/teams`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: teamName || school.name || "Team",
        item: teamUrl,
      },
    ],
  };

  const webPage: WebPage = {
    "@type": "WebPage",
    "@id": teamUrl,
    url: teamUrl,
    name: teamName || school.name || undefined,
    isPartOf: { "@id": websiteId },
    breadcrumb: { "@id": `${teamUrl}#breadcrumb` },
    mainEntity: { "@id": `${teamUrl}#team` },
    inLanguage: "en-US",
  };

  return {
    "@context": "https://schema.org",
    "@graph": [breadcrumb, webPage, sportsTeam],
  } satisfies Graph;
}

export function TeamPageJsonLd({
  school,
}: {
  school: TeamSchool | null | undefined;
}) {
  if (!school) {
    return null;
  }

  const data = buildTeamPageJsonLd(school);
  if (!data) {
    return null;
  }

  return <JsonLdScript data={data} id={`team-json-ld-${school.slug}`} />;
}

const NEWSROOM_POLICY_KEYS = [
  "publishingPrinciples",
  "correctionsPolicy",
  "ethicsPolicy",
  "ownershipFundingInfo",
] as const;

/**
 * Links to the newsroom's policy pages (set in Studio settings), as the
 * NewsMediaOrganization properties Google News reads. Relative paths are
 * made absolute; empty ones are left out.
 */
export function newsroomPolicyLinks(
  policies:
    | Partial<Record<(typeof NEWSROOM_POLICY_KEYS)[number], string | null>>
    | null
    | undefined,
  base: string,
) {
  const links: Partial<Record<(typeof NEWSROOM_POLICY_KEYS)[number], string>> =
    {};
  for (const key of NEWSROOM_POLICY_KEYS) {
    const value = policies?.[key];
    if (value) links[key] = new URL(value, base).toString();
  }
  return links;
}

export function OrganizationJsonLd({ settings }: { settings: any }) {
  if (!settings) return null;

  const resolvedBaseUrl = getBaseUrl();

  const socialLinks = settings.socialLinks
    ? (Object.values(settings.socialLinks).filter(Boolean) as string[])
    : undefined;

  const organizationJsonLd: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId,
    name: settings.siteBrand || "Redshirt Sports",
    description: settings.siteDescription || undefined,
    url: resolvedBaseUrl,
    logo: settings.logo
      ? ({
          "@type": "ImageObject",
          url: settings.logo,
        } as ImageObject)
      : undefined,
    contactPoint: settings.contactEmail
      ? ({
          "@type": "ContactPoint",
          email: settings.contactEmail,
          contactType: "general",
        } as ContactPoint)
      : undefined,
    sameAs: socialLinks?.length ? socialLinks : undefined,
    ...newsroomPolicyLinks(settings.newsroomPolicies, resolvedBaseUrl),
  };

  return <JsonLdScript data={organizationJsonLd} id="organization-json-ld" />;
}

export function WebSiteJsonLd({ settings }: { settings: any }) {
  if (!settings) return null;

  const resolvedBaseUrl = getBaseUrl();

  const webSiteJsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: resolvedBaseUrl,
    // Google reads the site name shown in results from WebSite.name, so this
    // is the brand, not the tagline (settings.siteTitle).
    name: settings.siteBrand || "Redshirt Sports",
    alternateName: ["Redshirt", "redshirtsports.com"],
    description: settings.siteDescription || undefined,
    inLanguage: "en-US",
    publisher: {
      "@id": organizationId,
    },
  };

  return <JsonLdScript data={webSiteJsonLd} id="website-json-ld" />;
}

export async function DynamicCombinedJsonLd() {
  return <CachedCombinedJsonLd {...(await resolveDynamicFetchOptions())} />;
}

export async function CachedCombinedJsonLd({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const { data: res } = await cachedSanity({
    query: querySettingsData,
    perspective,
    stega,
  });

  return (
    <>
      <OrganizationJsonLd settings={res} />
      <WebSiteJsonLd settings={res} />
    </>
  );
}
