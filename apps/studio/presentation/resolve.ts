import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from "sanity/presentation";

export const resolve: PresentationPluginOptions["resolve"] = {
  mainDocuments: defineDocuments([
    {
      route: "/",
      filter: `_type == "settings"`,
    },
    {
      route: "/authors/:slug",
      filter: `_type == "author" && slug.current == $slug`,
    },
    {
      route: "/college/teams/:slug",
      filter: `_type == "school" && slug.current == $slug`,
    },
    {
      route: "/:slug",
      filter: `_type == "post" && slug.current == $slug`,
    },
  ]),
  locations: {
    post: defineLocations({
      select: {
        title: "title",
        slug: "slug.current",
        sportSlug: "sport.slug.current",
      },
      resolve: (doc) => {
        const locations = [
          {
            title: doc?.title || "Untitled",
            href: `/${doc?.slug}`,
          },
        ];

        if (doc?.sportSlug) {
          locations.push({
            title: `${doc.sportSlug} news`,
            href: `/college/${doc.sportSlug}/news`,
          });
        }

        return { locations };
      },
    }),
    school: defineLocations({
      select: {
        title: "name",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: `/college/teams/${doc?.slug}`,
          },
        ],
      }),
    }),
    author: defineLocations({
      select: {
        title: "name",
        slug: "slug.current",
      },
      resolve: (doc) => ({
        locations: [
          {
            title: doc?.title || "Untitled",
            href: `/authors/${doc?.slug}`,
          },
        ],
      }),
    }),
    settings: defineLocations({
      select: { title: "siteTitle" },
      resolve: () => ({
        locations: [{ title: "Home", href: "/" }],
      }),
    }),
  },
};
