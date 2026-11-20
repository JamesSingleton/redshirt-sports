import { Geist } from "next/font/google";

// Module scope: Next downloads, subsets, and self-hosts it once at build time.
// One face for the whole site, headlines included; the admin app uses the
// same face under the same variable name.
// display "optional": a font that arrives after first paint is used from the
// next page view instead of swapping in and re-laying out the text (a layout
// shift). Preloaded fonts almost always arrive in time.
export const fontGeist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "optional",
});
