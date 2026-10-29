import { Barlow_Condensed, Inter, Source_Serif_4 } from "next/font/google";

// Module scope: Next downloads, subsets, and self-hosts these once at build time.
export const fontBarlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

export const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Article body face. Skip the homepage preload.
export const fontSourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
  preload: false,
});
