import "server-only";

import type { EmailLogo } from "@redshirt-sports/emails/logo";
import { client, urlForPng } from "@redshirt-sports/sanity/client";
import { queryGlobalSeoSettings } from "@redshirt-sports/sanity/queries";

/** Shown 28px tall, served at 2x for sharp retina screens. */
const HEIGHT = 28;

type LogoImage = {
  asset?: { _ref: string };
  width: number | null;
  height: number | null;
} | null;

export function toEmailLogo(image: LogoImage | undefined): EmailLogo | null {
  if (!image?.asset?._ref || !image.width || !image.height) return null;
  return {
    src: urlForPng(image)
      .height(HEIGHT * 2)
      .url(),
    width: Math.round((HEIGHT * image.width) / image.height),
    height: HEIGHT,
  };
}

/**
 * The site's wordmarks from Sanity settings, the same ones the footer uses:
 * `onLight` for white backgrounds, `onDark` for the ink header band. Null
 * when unset or unreachable; the emails fall back to the name in text, since
 * a missing logo is no reason to hold an email back.
 */
export async function emailLogos() {
  const settings = await client
    .fetch(queryGlobalSeoSettings)
    .catch((error: unknown) => {
      console.warn("Email logos unavailable:", error);
      return null;
    });
  return {
    onLight: toEmailLogo(settings?.footerLogo),
    onDark: toEmailLogo(settings?.footerLogoDarkMode),
  };
}
