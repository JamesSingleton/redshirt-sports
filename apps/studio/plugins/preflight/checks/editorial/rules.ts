import type { EditorialRuleResult } from "../../types";
import { extractLinks } from "../dead-links/extractLinks";

type PostDocument = Record<string, unknown>;
type BodyBlock = Record<string, unknown>;

function getSlug(document: PostDocument): string | undefined {
  const slug = document.slug as { current?: string } | undefined;
  return slug?.current;
}

function getBodyBlocks(document: PostDocument): BodyBlock[] {
  const body = document.body;
  return Array.isArray(body) ? (body as BodyBlock[]) : [];
}

function getHeadingBlocks(body: BodyBlock[]) {
  return body.filter(
    (block) =>
      block._type === "block" &&
      typeof block.style === "string" &&
      block.style.startsWith("h"),
  );
}

function validateTitle(document: PostDocument): EditorialRuleResult {
  const title = typeof document.title === "string" ? document.title : "";
  const length = title.trim().length;

  if (length === 0) {
    return {
      id: "title",
      label: "Title length (15–70 chars)",
      status: "error",
      message: "Title is required",
    };
  }

  if (length < 15 || length > 70) {
    return {
      id: "title",
      label: "Title length (15–70 chars)",
      status: "warning",
      detail: `Current: ${length} characters`,
    };
  }

  return {
    id: "title",
    label: "Title length (15–70 chars)",
    status: "success",
    detail: `${length} characters`,
  };
}

function validateExcerpt(document: PostDocument): EditorialRuleResult {
  const excerpt = typeof document.excerpt === "string" ? document.excerpt : "";
  const length = excerpt.trim().length;

  if (length === 0) {
    return {
      id: "excerpt",
      label: "Excerpt length (140–160 chars)",
      status: "error",
      message: "Excerpt is required",
    };
  }

  if (length < 140 || length > 160) {
    return {
      id: "excerpt",
      label: "Excerpt length (140–160 chars)",
      status: "warning",
      detail: `Current: ${length} characters`,
    };
  }

  return {
    id: "excerpt",
    label: "Excerpt length (140–160 chars)",
    status: "success",
    detail: `${length} characters`,
  };
}

function validateSeoDescription(
  document: PostDocument,
): EditorialRuleResult | null {
  const seoDescription =
    typeof document.seoDescription === "string" ? document.seoDescription : "";
  const length = seoDescription.trim().length;

  if (length === 0) {
    return null;
  }

  if (length > 160) {
    return {
      id: "seoDescription",
      label: "SEO description length (≤ 160 chars)",
      status: "warning",
      detail: `Current: ${length} characters`,
    };
  }

  return {
    id: "seoDescription",
    label: "SEO description length (≤ 160 chars)",
    status: "success",
    detail: `${length} characters`,
  };
}

function validateSlug(document: PostDocument): EditorialRuleResult {
  const slug = getSlug(document);

  if (!slug) {
    return {
      id: "slug",
      label: "Slug present",
      status: "error",
      message: "Slug is required before publishing",
    };
  }

  return {
    id: "slug",
    label: "Slug present",
    status: "success",
    detail: slug,
  };
}

function validateImage(document: PostDocument): EditorialRuleResult {
  const image =
    document.image ?? (document as { mainImage?: unknown }).mainImage;

  if (!image) {
    return {
      id: "image",
      label: "Image present",
      status: "error",
      message: "Image is required",
    };
  }

  return {
    id: "image",
    label: "Image present",
    status: "success",
  };
}

function validateBodyImageCaptions(body: BodyBlock[]): EditorialRuleResult {
  const missingCaptionCount = body.filter(
    (block) =>
      block._type === "image" &&
      !(typeof block.caption === "string" && block.caption.trim()),
  ).length;

  if (missingCaptionCount > 0) {
    return {
      id: "bodyImageCaptions",
      label: "Body images have captions",
      status: "warning",
      detail: `${missingCaptionCount} image${missingCaptionCount === 1 ? "" : "s"} missing caption`,
    };
  }

  return {
    id: "bodyImageCaptions",
    label: "Body images have captions",
    status: "success",
  };
}

function validateFirstHeading(body: BodyBlock[]): EditorialRuleResult {
  const headings = getHeadingBlocks(body);

  if (headings.length === 0) {
    return {
      id: "firstHeading",
      label: "First heading is h2",
      status: "success",
      detail: "No headings in body",
    };
  }

  const firstStyle =
    typeof headings[0]?.style === "string" ? headings[0].style : undefined;

  if (firstStyle !== "h2") {
    return {
      id: "firstHeading",
      label: "First heading is h2",
      status: "warning",
      message: `First heading is ${firstStyle ?? "unknown"}`,
    };
  }

  return {
    id: "firstHeading",
    label: "First heading is h2",
    status: "success",
  };
}

function validateHeadingOrder(body: BodyBlock[]): EditorialRuleResult {
  const headings = getHeadingBlocks(body);

  for (let index = 0; index < headings.length - 1; index += 1) {
    const current = headings[index];
    const next = headings[index + 1];
    const currentStyle =
      typeof current?.style === "string" ? current.style : undefined;
    const nextStyle = typeof next?.style === "string" ? next.style : undefined;

    if (!currentStyle || !nextStyle) {
      continue;
    }

    const currentLevel = Number.parseInt(currentStyle.replace("h", ""), 10);
    const nextLevel = Number.parseInt(nextStyle.replace("h", ""), 10);

    if (currentLevel < nextLevel && nextLevel - currentLevel > 1) {
      return {
        id: "headingOrder",
        label: "Heading levels do not skip",
        status: "warning",
        message: `${currentStyle} is followed by ${nextStyle}`,
      };
    }
  }

  return {
    id: "headingOrder",
    label: "Heading levels do not skip",
    status: "success",
  };
}

function validateIncompleteLinks(body: unknown): EditorialRuleResult {
  const incompleteLinks = extractLinks(body).filter(
    (finding) => finding.incomplete,
  );

  if (incompleteLinks.length > 0) {
    return {
      id: "incompleteLinks",
      label: "Body links are complete",
      status: "warning",
      detail: `${incompleteLinks.length} incomplete link${incompleteLinks.length === 1 ? "" : "s"} in body`,
    };
  }

  return {
    id: "incompleteLinks",
    label: "Body links are complete",
    status: "success",
  };
}

function validateYouTubeUrls(body: BodyBlock[]): EditorialRuleResult | null {
  const youtubeBlocks = body.filter((block) => block._type === "youtubeEmbed");

  if (youtubeBlocks.length === 0) {
    return null;
  }

  const invalidBlocks = youtubeBlocks.filter((block) => {
    const url = typeof block.url === "string" ? block.url : "";
    return !/(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url);
  });

  if (invalidBlocks.length > 0) {
    return {
      id: "youtubeUrls",
      label: "YouTube embed URLs are valid",
      status: "error",
      detail: `${invalidBlocks.length} invalid YouTube URL${invalidBlocks.length === 1 ? "" : "s"}`,
    };
  }

  return {
    id: "youtubeUrls",
    label: "YouTube embed URLs are valid",
    status: "success",
  };
}

function validateTwitterEmbeds(body: BodyBlock[]): EditorialRuleResult | null {
  const twitterBlocks = body.filter((block) => block._type === "twitter");

  if (twitterBlocks.length === 0) {
    return null;
  }

  const invalidBlocks = twitterBlocks.filter((block) => {
    const id = typeof block.id === "string" ? block.id.trim() : "";
    return id.length === 0 || !/^\d+$/.test(id);
  });

  if (invalidBlocks.length > 0) {
    return {
      id: "twitterEmbeds",
      label: "Twitter embed IDs are valid",
      status: "error",
      detail: `${invalidBlocks.length} embed${invalidBlocks.length === 1 ? "" : "s"} missing or invalid tweet ID`,
    };
  }

  return {
    id: "twitterEmbeds",
    label: "Twitter embed IDs are valid",
    status: "success",
  };
}

export function runEditorialRules(
  document: PostDocument,
): EditorialRuleResult[] {
  const body = getBodyBlocks(document);

  return [
    validateTitle(document),
    validateExcerpt(document),
    validateSeoDescription(document),
    validateSlug(document),
    validateImage(document),
    validateBodyImageCaptions(body),
    validateFirstHeading(body),
    validateHeadingOrder(body),
    validateIncompleteLinks(body),
    validateYouTubeUrls(body),
    validateTwitterEmbeds(body),
  ].filter((result): result is EditorialRuleResult => result !== null);
}

export function getEditorialBadge(results: EditorialRuleResult[]): string {
  const passed = results.filter((result) => result.status === "success").length;
  return `${passed}/${results.length} checks passed`;
}
