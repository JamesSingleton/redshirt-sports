import type { CollectionPage, WithContext } from "schema-dts";

import type { HomePost } from "@/components/home/home-page-content";
import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();
const websiteId = `${baseUrl}/#website`;
const organizationId = `${baseUrl}/#organization`;

export function buildDivisionNewsCollectionJsonLd({
  sport,
  division,
  sportTitle,
  divisionTitle,
  divisionOrSubgroupingName,
  pageIndex,
  posts,
  totalPosts,
}: {
  sport: string;
  division: string;
  sportTitle?: string | null;
  divisionTitle?: string | null;
  divisionOrSubgroupingName: string;
  pageIndex: number;
  posts: HomePost[];
  totalPosts?: number;
}): WithContext<CollectionPage> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${divisionTitle} ${sportTitle} News`,
    description: `Stay informed with breaking ${divisionOrSubgroupingName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    url: `${baseUrl}/college/${sport}/news/${division}${pageIndex > 1 ? `?page=${pageIndex}` : ""}`,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@id": `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: totalPosts,
      url: `${baseUrl}/college/${sport}/news/${division}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "News",
          item: `${baseUrl}/college/news`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: sportTitle ?? sport,
          item: `${baseUrl}/college/${sport}/news`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: divisionTitle ?? "",
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
      ],
    },
  };
}

export function buildConferenceNewsCollectionJsonLd({
  sport,
  division,
  conference,
  sportTitle,
  divisionOrSubgroupingName,
  conferenceName,
  conferenceShortName,
  pageIndex,
  posts,
  totalPosts,
}: {
  sport: string;
  division: string;
  conference: string;
  sportTitle?: string | null;
  divisionOrSubgroupingName: string;
  conferenceName: string;
  conferenceShortName?: string | null;
  pageIndex: number;
  posts: HomePost[];
  totalPosts?: number;
}): WithContext<CollectionPage> {
  const title = conferenceShortName
    ? `${conferenceShortName} ${sportTitle} News`
    : `${conferenceName} ${sportTitle} News`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: `Stay informed with breaking ${conferenceShortName ?? conferenceName} ${divisionOrSubgroupingName} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    url: `${baseUrl}/college/${sport}/news/${division}/${conference}${pageIndex > 1 ? `?page=${pageIndex}` : ""}`,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@id": `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: totalPosts,
      url: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "News",
          item: `${baseUrl}/college/news`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: sportTitle ?? sport,
          item: `${baseUrl}/college/${sport}/news`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: divisionOrSubgroupingName,
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
        {
          "@type": "ListItem",
          position: 5,
          name: conferenceShortName ?? conferenceName,
          item: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
        },
      ],
    },
  };
}
