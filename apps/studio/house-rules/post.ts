import { parseExternalRef } from "@redshirt-sports/sanity/external-refs";
import {
  GAME_STORY_TYPES,
  type StoryType,
} from "@redshirt-sports/sanity/story-types";

import {
  type BodyStats,
  blockText,
  bodyFindings,
  bodyLinkTargetFindings,
  bodyStats,
  countWords,
} from "./body";
import { LIMITS } from "./limits";
import {
  altTextFindings,
  creditFindings,
  excerptFindings,
  headlineFindings,
  heroImageFindings,
  seoDescriptionFindings,
  seoTitleFindings,
} from "./text";
import {
  type BodyBlock,
  error,
  type Finding,
  isTextBlock,
  type Reference,
  warning,
} from "./types";

export {
  GAME_STORY_TYPES,
  STORY_TYPES,
  type StoryType,
  storyTypeTitle,
} from "@redshirt-sports/sanity/story-types";

export type Correction = {
  _key?: string;
  kind?: string;
  date?: string;
  text?: string;
};

export type Faq = { _key?: string; question?: string; answer?: string };

export type PostLike = {
  title?: string;
  slug?: { current?: string };
  storyType?: string;
  authors?: Reference[];
  contributors?: Reference[];
  editedBy?: Reference;
  image?: {
    asset?: Reference;
    alt?: string;
    attribution?: string;
  };
  sport?: Reference;
  classification?: Reference;
  sportSubgrouping?: Reference;
  conferences?: Reference[];
  teams?: Reference[];
  tags?: Reference[];
  excerpt?: string;
  body?: BodyBlock[];
  keyTakeaways?: string[];
  faqs?: Faq[];
  corrections?: Correction[];
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
  /** "<provider>:<id>|<label>"; see external-refs. */
  game?: string;
  players?: string[];
};

const refs = (list: Reference[] | undefined) =>
  (list ?? []).map((item) => item._ref).filter(Boolean) as string[];

export function bylineFindings(
  authors: Reference[] | undefined,
  contributors?: Reference[] | undefined,
): Finding[] {
  const findings: Finding[] = [];
  const authorIds = refs(authors);
  if (authorIds.length === 0) {
    findings.push(
      error("byline.required", "Add at least one author to the byline."),
    );
  }
  if (authorIds.length > LIMITS.authors.max) {
    findings.push(
      error(
        "byline.max",
        `A byline holds up to ${LIMITS.authors.max} authors. Move the rest to Contributors.`,
      ),
    );
  }
  if (new Set(authorIds).size !== authorIds.length) {
    findings.push(
      error("byline.duplicate", "The same author is in the byline twice."),
    );
  }
  const overlap = refs(contributors).some((id) => authorIds.includes(id));
  if (overlap) {
    findings.push(
      error(
        "byline.contributor-overlap",
        "Someone is listed as both an author and a contributor. Pick one.",
      ),
    );
  }
  return findings;
}

export function coverageFindings(post: PostLike): Finding[] {
  const findings: Finding[] = [];
  const teamCount = refs(post.teams).length;
  const tagCount = refs(post.tags).length;

  // Both are optional: some articles cover a whole division, or college
  // sports in general. Without them the article only appears in the
  // all-sports feed, so say so.
  if (!post.sport?._ref) {
    findings.push(
      warning(
        "coverage.sport",
        "No sport, so the article won't appear on any sport's news page or feed. Leave it empty only if it isn't about one sport.",
      ),
    );
  }
  if (!post.classification?._ref) {
    findings.push(
      warning(
        "coverage.classification",
        "No division, so the article won't appear on any division's news page. Leave it empty only if it covers several divisions.",
      ),
    );
  }
  if (new Set(refs(post.teams)).size !== teamCount) {
    findings.push(error("coverage.team-duplicate", "A team is listed twice."));
  }
  if (new Set(refs(post.conferences)).size !== refs(post.conferences).length) {
    findings.push(
      error("coverage.conference-duplicate", "A conference is listed twice."),
    );
  }
  if (tagCount > LIMITS.tags.max) {
    findings.push(
      error(
        "coverage.tags-max",
        `Use up to ${LIMITS.tags.max} tags. More than that dilutes the related-articles match.`,
      ),
    );
  }
  if (new Set(refs(post.tags)).size !== tagCount) {
    findings.push(error("coverage.tag-duplicate", "A tag is listed twice."));
  }
  if (tagCount === 0) {
    findings.push(
      warning(
        "coverage.tags-min",
        "No tags yet. Tags are suggested from the body a few seconds after you start writing; add one if none appear.",
      ),
    );
  }

  const type = post.storyType;
  if (teamCount === 0 && post.sport?._ref) {
    findings.push(
      warning(
        "coverage.teams-min",
        "No teams tagged, so this article won't appear on any team page.",
      ),
    );
  }
  const isGameStory = GAME_STORY_TYPES.includes(type as StoryType);
  if (isGameStory && teamCount === 1) {
    findings.push(
      warning(
        "coverage.game-teams",
        "A game article usually tags both teams so it shows on each team's page.",
      ),
    );
  }
  if (isGameStory && !post.game) {
    findings.push(
      warning(
        "coverage.game",
        "Pick the game. It links the article to live scores and tells search engines which game it covers.",
      ),
    );
  }
  return [...findings, ...externalRefFindings(post)];
}

/** Games and players are stored as provider ids; see external-refs. */
export function externalRefFindings(post: PostLike): Finding[] {
  const findings: Finding[] = [];
  if (post.game && !parseExternalRef(post.game)) {
    findings.push(
      error(
        "coverage.game-format",
        "The game isn't in the expected format. Clear it and pick it again from the list.",
      ),
    );
  }
  const players = post.players ?? [];
  if (players.some((player) => !parseExternalRef(player))) {
    findings.push(
      error(
        "coverage.player-format",
        "A player isn't in the expected format. Remove it and pick it again from the list.",
      ),
    );
  }
  const ids = players.map((player) => parseExternalRef(player)?.id);
  if (new Set(ids).size !== ids.length) {
    findings.push(
      error("coverage.player-duplicate", "A player is listed twice."),
    );
  }
  if (players.length > LIMITS.players.max) {
    findings.push(
      warning(
        "coverage.players-max",
        `Tag up to ${LIMITS.players.max} players: the ones the article is about, not everyone it mentions.`,
      ),
    );
  }
  return findings;
}

export function keyTakeawayFindings(items: string[] | undefined): Finding[] {
  const list = items ?? [];
  if (list.length === 0) return [];
  const { min, max, itemMin, itemMax } = LIMITS.keyTakeaways;
  const findings: Finding[] = [];
  if (list.length < min || list.length > max) {
    findings.push(
      error(
        "takeaways.count",
        `Write ${min} to ${max} key takeaways, or none. You have ${list.length}.`,
      ),
    );
  }
  list.forEach((item, index) => {
    const text = item?.trim() ?? "";
    if (text.length < itemMin || text.length > itemMax) {
      findings.push(
        error(
          "takeaways.length",
          `Takeaway ${index + 1} is ${text.length} characters. Each one is a single sentence of ${itemMin} to ${itemMax} characters.`,
        ),
      );
    }
  });
  const normalized = list.map((item) => item?.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    findings.push(error("takeaways.duplicate", "Two takeaways are identical."));
  }
  return findings;
}

export function faqFindings(faqs: Faq[] | undefined): Finding[] {
  const list = faqs ?? [];
  if (list.length === 0) return [];
  const { max, questionMax, answerMin, answerMax } = LIMITS.faq;
  const findings: Finding[] = [];
  if (list.length > max) {
    findings.push(
      error("faq.max", `Keep it to ${max} questions. You have ${list.length}.`),
    );
  }
  list.forEach((faq, index) => {
    const question = faq.question?.trim() ?? "";
    const answer = faq.answer?.trim() ?? "";
    const label = `Question ${index + 1}`;
    if (!question) {
      findings.push(error("faq.question-required", `${label} is empty.`));
    } else {
      if (!question.endsWith("?")) {
        findings.push(
          error(
            "faq.question-mark",
            `${label} must be phrased as a question and end with "?".`,
          ),
        );
      }
      if (question.length > questionMax) {
        findings.push(
          error(
            "faq.question-max",
            `${label} is ${question.length} characters. Keep questions to ${questionMax} or fewer.`,
          ),
        );
      }
    }
    if (!answer) {
      findings.push(error("faq.answer-required", `${label} has no answer.`));
    } else if (answer.length < answerMin || answer.length > answerMax) {
      findings.push(
        error(
          "faq.answer-length",
          `The answer to ${label.toLowerCase()} is ${answer.length} characters. Answer in ${answerMin} to ${answerMax}: lead with the direct answer, then one supporting fact.`,
        ),
      );
    }
  });
  const questions = list.map((faq) => faq.question?.trim().toLowerCase());
  if (new Set(questions).size !== questions.length) {
    findings.push(error("faq.duplicate", "Two questions are identical."));
  }
  return findings;
}

export function correctionFindings(
  corrections: Correction[] | undefined,
  publishedAt?: string,
): Finding[] {
  const findings: Finding[] = [];
  (corrections ?? []).forEach((correction, index) => {
    const label = `Correction ${index + 1}`;
    if (!correction.text?.trim()) {
      findings.push(
        error(
          "correction.text",
          `${label} needs text saying what was wrong and what is right now.`,
        ),
      );
    }
    if (!correction.date) {
      findings.push(error("correction.date", `${label} needs a date.`));
    } else if (publishedAt && correction.date < publishedAt) {
      findings.push(
        error(
          "correction.before-publish",
          `${label} is dated before the article was published.`,
        ),
      );
    }
  });
  return findings;
}

export function imageFindings(image: PostLike["image"]): Finding[] {
  if (!image?.asset?._ref) {
    return [
      error("image.required", "Add a lead image. Articles don't run without."),
    ];
  }
  return [
    ...altTextFindings(image.alt),
    ...creditFindings(image.attribution),
    ...heroImageFindings(image.asset._ref),
  ];
}

function inlineImageFindings(body: BodyBlock[] | undefined): Finding[] {
  const findings: Finding[] = [];
  for (const block of body ?? []) {
    if (isTextBlock(block) || block._type !== "image") continue;
    const image = block as BodyBlock & { alt?: string; attribution?: string };
    for (const finding of [
      ...altTextFindings(image.alt),
      ...creditFindings(image.attribution),
    ]) {
      findings.push({ ...finding, blockKey: block._key });
    }
  }
  return findings;
}

export type StoryCheckSection = {
  id: string;
  title: string;
  findings: Finding[];
};

export type StoryCheck = {
  sections: StoryCheckSection[];
  stats: BodyStats & { headlineChars: number; excerptChars: number };
  errors: number;
  warnings: number;
};

/** Run every house rule against an article. Powers the Article Check pane. */
export function checkStory(post: PostLike): StoryCheck {
  const body = post.body ?? [];
  const stats = bodyStats(body);
  const longRead = stats.words > 800;

  const answerReady: Finding[] = [
    ...keyTakeawayFindings(post.keyTakeaways),
    ...faqFindings(post.faqs),
  ];
  if (longRead && (post.keyTakeaways ?? []).length === 0) {
    answerReady.push(
      warning(
        "takeaways.suggest",
        `This is a ${stats.words}-word article. Add key takeaways so readers and AI answers get the point in three lines.`,
      ),
    );
  }

  const sections: StoryCheckSection[] = [
    {
      id: "headline",
      title: "Headline & summary",
      findings: [
        ...headlineFindings(post.title),
        ...excerptFindings(post.excerpt, post.title),
      ],
    },
    {
      id: "byline",
      title: "Byline",
      findings: bylineFindings(post.authors, post.contributors),
    },
    { id: "image", title: "Lead image", findings: imageFindings(post.image) },
    {
      id: "body",
      title: "Body",
      findings: [
        ...bodyFindings(body),
        ...bodyLinkTargetFindings(body),
        ...inlineImageFindings(body),
      ],
    },
    { id: "coverage", title: "Coverage", findings: coverageFindings(post) },
    { id: "answers", title: "Takeaways & FAQ", findings: answerReady },
    {
      id: "seo",
      title: "Search",
      findings: [
        ...seoTitleFindings(post.seoTitle, post.title),
        ...seoDescriptionFindings(post.seoDescription),
      ],
    },
    {
      id: "standards",
      title: "Standards",
      findings: correctionFindings(post.corrections, post.publishedAt),
    },
  ];

  const all = sections.flatMap((section) => section.findings);
  return {
    sections,
    stats: {
      ...stats,
      headlineChars: post.title?.length ?? 0,
      excerptChars: post.excerpt?.length ?? 0,
    },
    errors: all.filter((finding) => finding.level === "error").length,
    warnings: all.filter((finding) => finding.level === "warning").length,
  };
}

/** Plain text of the first paragraph, for previews. */
export function ledeText(body: BodyBlock[] | undefined): string {
  for (const block of body ?? []) {
    if (isTextBlock(block) && !block.listItem && block.style === "normal") {
      const text = blockText(block).trim();
      if (countWords(text) > 0) return text;
    }
  }
  return "";
}
