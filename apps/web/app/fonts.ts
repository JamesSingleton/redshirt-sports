import localFont from "next/font/local";

export const fontBarlow = localFont({
  src: [
    {
      path: "./fonts/barlow-condensed-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/barlow-condensed-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/barlow-condensed-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/barlow-condensed-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-barlow",
  display: "swap",
});

export const fontInter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const fontSourceSerif = localFont({
  src: [
    {
      path: "./fonts/source-serif-4-latin-wght-normal.woff2",
      style: "normal",
    },
    {
      path: "./fonts/source-serif-4-latin-wght-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-source-serif",
  display: "swap",
});
