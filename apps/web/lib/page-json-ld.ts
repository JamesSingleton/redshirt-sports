import type { CollectionPage, WebPage, WithContext } from "schema-dts";

import { getBaseUrl } from "@/lib/get-base-url";

export type PageCrumb = {
  name: string;
  path: string;
};

export type PageListItem = {
  name: string;
  path: string;
};

function absoluteUrl(path: string) {
  const base = getBaseUrl().replace(/\/$/, "");
  if (path === "/") {
    return base;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** WebPage or CollectionPage with a breadcrumb trail and an optional item list. */
export function buildIndexedPageJsonLd({
  pageType = "WebPage",
  name,
  description,
  path,
  breadcrumbs,
  items,
}: {
  pageType?: "WebPage" | "CollectionPage";
  name: string;
  description?: string;
  path: string;
  breadcrumbs: PageCrumb[];
  items?: PageListItem[];
}): WithContext<WebPage | CollectionPage> {
  const url = absoluteUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": `${url.split("?")[0]}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${absoluteUrl("/")}#website`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${absoluteUrl("/")}#organization`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      "@id": `${url.split("?")[0]}#breadcrumb`,
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    },
    ...(items
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: items.length,
            itemListElement: items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              url: absoluteUrl(item.path),
            })),
          },
        }
      : {}),
  };
}
