import type { MetadataRoute } from "next";

import { env } from "@/env";

/** Brand red, and the light-mode page background (`--background`). */
const BRAND_RED = "#E80022";
const PAGE_BACKGROUND = "#FDFCFB";

const SHORTCUT_ICON = {
  src: "/icons/icon-96.png",
  sizes: "96x96",
  type: "image/png",
};

/**
 * Web app manifest. Icons are drawn from the brand emblem in
 * `public/icons/`: `any` icons are the red mark on transparent, `maskable`
 * ones are white on red with the mark inside the 80% safe zone so Android's
 * circle and squircle masks never clip it, and `monochrome` is the mark's
 * alpha for OS-tinted icons. Screenshots in `public/screenshots/` feed the
 * richer install dialog in Chrome (one `wide`, one `narrow` at least).
 */
export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_APP_NAME ?? "Redshirt Sports";
  return {
    id: "/",
    name,
    short_name: "Redshirt",
    description: `${name} covers college football and basketball at every level, from FBS to Division III, with our own Top 25, previews, recaps and projections.`,
    lang: "en-US",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "any",
    background_color: PAGE_BACKGROUND,
    theme_color: BRAND_RED,
    categories: ["sports", "news"],
    prefer_related_applications: false,
    launch_handler: { client_mode: ["navigate-existing", "auto"] },
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-monochrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home-wide.webp",
        sizes: "1280x720",
        type: "image/webp",
        form_factor: "wide",
        label: "Latest college football and basketball news",
      },
      {
        src: "/screenshots/rankings-wide.webp",
        sizes: "1280x720",
        type: "image/webp",
        form_factor: "wide",
        label: "Redshirt Sports Top 25 polls",
      },
      {
        src: "/screenshots/home-narrow.webp",
        sizes: "390x844",
        type: "image/webp",
        form_factor: "narrow",
        label: "Latest college football and basketball news",
      },
      {
        src: "/screenshots/rankings-narrow.webp",
        sizes: "390x844",
        type: "image/webp",
        form_factor: "narrow",
        label: "Redshirt Sports Top 25 polls",
      },
    ],
    shortcuts: [
      {
        name: "Football Top 25",
        short_name: "Rankings",
        description: "Every Redshirt Sports football poll",
        url: "/college/football/rankings",
        icons: [SHORTCUT_ICON],
      },
      {
        name: "College Football News",
        short_name: "Football",
        description: "The latest college football stories",
        url: "/college/football/news",
        icons: [SHORTCUT_ICON],
      },
      // The portal 404s until it launches; don't offer a dead shortcut.
      ...(env.PORTAL_PUBLIC === "true"
        ? [
            {
              name: "Transfer Portal",
              short_name: "Portal",
              description: "Transfer portal tracker",
              url: "/transfer-portal",
              icons: [SHORTCUT_ICON],
            },
          ]
        : []),
      {
        name: "Search",
        description: "Search Redshirt Sports",
        url: "/search",
        icons: [SHORTCUT_ICON],
      },
    ],
  };
}
