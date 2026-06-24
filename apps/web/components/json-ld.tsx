import { urlFor } from "@redshirt-sports/sanity/client";
import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { querySettingsData } from "@redshirt-sports/sanity/queries";
import { toPlainText } from "next-sanity";
import type {
  BreadcrumbList,
  ContactPoint,
  Graph,
  ImageObject,
  NewsArticle,
  Organization,
  Person,
  SportsTeam,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

import { getArticleTagNames } from "@/lib/article-seo";
import { getBaseUrl } from "@/lib/get-base-url";
import { sanityFetchPage } from "@/lib/sanity-fetch";
import { getCollegeSportSection } from "@/lib/sport-section";

const baseUrl = getBaseUrl();

export const organizationId = `${baseUrl}/#organization`;
export const websiteId = `${baseUrl}/#website`;

type PostArticle = {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  publishedAt?: string | null;
  _updatedAt?: string | null;
  body?: unknown;
  authors?: Array<{ name?: string | null; slug?: string | null } | null> | null;
  image?: {
    alt?: string | null;
    asset?: { _ref?: string };
  } | null;
  sport?: { slug?: string | null; title?: string | null } | null;
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

export function buildSafeImageUrl(
  image?: { asset?: { _ref?: string } } | null,
) {
  if (!image?.asset?._ref) {
    return undefined;
  }
  return urlFor({ ...image, _id: image.asset?._ref })
    .size(1920, 1080)
    .dpr(2)
    .auto("format")
    .quality(80)
    .url();
}

function buildImageObject({
  imageUrl,
  alt,
  id,
}: {
  imageUrl: string;
  alt?: string | null;
  id?: string;
}): ImageObject {
  return {
    "@type": "ImageObject",
    ...(id ? { "@id": id } : {}),
    url: imageUrl,
    contentUrl: imageUrl,
    caption: alt ?? undefined,
    width: "1920",
    height: "1080",
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
  const articleSection = getCollegeSportSection(article.sport);
  const tagNames = getArticleTagNames(article.tags);
  const pageName = article.title
    ? `${article.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    : undefined;

  const breadcrumb: BreadcrumbList = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    name: article.title
      ? `${article.title} breadcrumbs`
      : "Article breadcrumbs",
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
        name: article.title ?? "Article",
        item: articleUrl,
      },
    ],
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
    dateModified: article._updatedAt ?? undefined,
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

  const newsArticle: NewsArticle = {
    "@type": "NewsArticle",
    "@id": articleId,
    isPartOf: { "@id": websiteId },
    author: article.authors
      ? article.authors.filter(Boolean).map((author) => {
          return {
            "@type": "Person",
            name: author?.name ?? undefined,
            url: author?.slug
              ? `${resolvedBaseUrl}/authors/${author.slug}`
              : undefined,
          } as Person;
        })
      : [],
    headline: article.title ?? undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article._updatedAt ?? undefined,
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
          ],
          thumbnailUrl: imageUrl,
        }
      : {}),
    url: articleUrl,
    inLanguage: "en-US",
    ...(articleSection ? { articleSection } : {}),
    ...(tagNames.length > 0 ? { keywords: tagNames.join(", ") } : {}),
    copyrightYear: article.publishedAt
      ? new Date(article.publishedAt).getFullYear()
      : new Date().getFullYear(),
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
  const logoUrl = buildSafeImageUrl(school.image ?? undefined);
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
    name: settings.siteTitle,
    description: settings.siteDescription || undefined,
    publisher: {
      "@id": organizationId,
    },
    potentialAction: [
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${resolvedBaseUrl}/search?q={search_term_string}`,
        },
        // @ts-expect-error query-input is a valid property
        "query-input": {
          "@type": "PropertyValueSpecification",
          valueRequired: true,
          valueName: "search_term_string",
        },
      },
    ],
  };

  return <JsonLdScript data={webSiteJsonLd} id="website-json-ld" />;
}

export async function DynamicCombinedJsonLd() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedCombinedJsonLd perspective={perspective} stega={stega} />;
}

export async function CachedCombinedJsonLd({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const { data: res } = await sanityFetchPage({
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
