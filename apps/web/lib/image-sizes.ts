/** `sizes` hints for responsive Sanity images, keyed by layout slot. */
export const IMAGE_SIZES = {
  articleCard:
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  articleHero: "(max-width: 1024px) 100vw, 880px",
  homeHero: "(max-width: 1024px) 100vw, 66vw",
  articleInline: "(max-width: 1024px) 100vw, min(720px, 70vw)",
} as const;
