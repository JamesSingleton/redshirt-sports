import type { CollectionPage, WithContext } from "schema-dts";

import type { HomePost } from "@/components/home/home-page-content";
import { getBaseUrl } from "@/lib/get-base-url";
import {
  collegeNewsMetaDescription,
  conferenceNewsMetaDescription,
  divisionNewsMetaDescription,
  sportNewsMetaDescription,
} from "@/lib/news-archive/meta-descriptions";

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
    description: divisionNewsMetaDescription(
      divisionOrSubgroupingName,
      sportTitle ?? sport,
      pageIndex,
    ),
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

function newsItemList(posts: HomePost[], listUrl: string, totalPosts?: number) {
  return {
    "@type": "ItemList" as const,
    itemListElement: posts.map((post, index) => ({
      "@id": `${baseUrl}/${post.slug}#article`,
      position: index + 1,
    })),
    numberOfItems: totalPosts,
    url: listUrl,
  };
}

export function buildCollegeNewsCollectionJsonLd({
  pageIndex,
  posts,
  totalPosts,
}: {
  pageIndex: number;
  posts: HomePost[];
  totalPosts?: number;
}): WithContext<CollectionPage> {
  const path = `/college/news${pageIndex > 1 ? `?page=${pageIndex}` : ""}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "College News",
    description: collegeNewsMetaDescription(pageIndex),
    url: `${baseUrl}${path}`,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: newsItemList(posts, `${baseUrl}/college/news`, totalPosts),
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
      ],
    },
  };
}

export function buildSportNewsCollectionJsonLd({
  sport,
  sportTitle,
  pageIndex,
  posts,
  totalPosts,
}: {
  sport: string;
  sportTitle?: string | null;
  pageIndex: number;
  posts: HomePost[];
  totalPosts?: number;
}): WithContext<CollectionPage> {
  const name = `${sportTitle ?? sport} News`;
  const path = `/college/${sport}/news${pageIndex > 1 ? `?page=${pageIndex}` : ""}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: sportNewsMetaDescription(sportTitle ?? sport, pageIndex),
    url: `${baseUrl}${path}`,
    isPartOf: { "@id": websiteId, "@type": "WebSite" },
    publisher: { "@id": organizationId, "@type": "Organization" },
    mainEntity: newsItemList(
      posts,
      `${baseUrl}/college/${sport}/news`,
      totalPosts,
    ),
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
    description: conferenceNewsMetaDescription(
      conferenceShortName ?? conferenceName,
      divisionOrSubgroupingName,
      sportTitle ?? sport,
      pageIndex,
    ),
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
