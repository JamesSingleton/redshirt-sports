/**
 * Every number a house rule checks against. Change a limit here and the
 * validation message, the character counter, and the Article Check pane follow.
 */
export const LIMITS = {
  headline: {
    /** Google's Article structured data rejects headlines over 110. */
    max: 110,
    /** Past ~70 the headline is cut off in search results and social cards. */
    ideal: 70,
    min: 25,
  },
  seoTitle: {
    /** 60 leaves room for the " | Redshirt Sports" suffix the site adds. */
    max: 60,
  },
  seoDescription: { max: 155 },
  excerpt: { min: 50, idealMin: 120, idealMax: 160, max: 300 },
  slug: { max: 75 },
  altText: { max: 125 },
  body: {
    /** Under this, search engines treat the page as thin content. */
    thinWords: 150,
    /** A lede longer than this buries the news. */
    ledeWords: 60,
    paragraphWords: 120,
    /** Longer articles need subheadings so readers can scan. */
    subheadsAfterWords: 600,
    headingChars: 80,
    wordsPerMinute: 230,
  },
  authors: { max: 4 },
  tags: { max: 5 },
  players: { max: 8 },
  keyTakeaways: { min: 2, max: 5, itemMin: 20, itemMax: 200 },
  faq: { max: 8, questionMax: 150, answerMin: 40, answerMax: 600 },
  authorBio: { min: 100, max: 600 },
  heroImage: {
    /** Google Discover only shows large previews for images this wide. */
    minWidth: 1200,
  },
} as const;

export const SITE_NAME = "Redshirt Sports";
export const SITE_HOSTS = ["redshirtsports.com", "www.redshirtsports.com"];
