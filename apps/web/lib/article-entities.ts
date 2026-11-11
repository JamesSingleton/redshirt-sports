import { parseExternalRef } from "@redshirt-sports/sanity/external-refs";
import type {
  CorrectionComment,
  Person,
  SportsEvent,
  SportsOrganization,
  SportsTeam,
  Thing,
} from "schema-dts";

/**
 * Structured-data entities for an article: who wrote it, what it's about,
 * and how it changed. Search and answer engines use these to tell which
 * teams, games, and players an article covers, and who is behind it.
 */

type MaybeString = string | null | undefined;

export type ArticleAuthorInput = {
  name?: MaybeString;
  slug?: MaybeString;
  roles?: MaybeString[] | null;
  biography?: MaybeString;
  knowsAbout?: MaybeString[] | null;
  socialLinks?: Record<string, MaybeString> | null;
} | null;

export type ArticleEntityInput = {
  sport?: { title?: MaybeString } | null;
  teams?: Array<{ name?: MaybeString; slug?: MaybeString } | null> | null;
  conferences?: Array<{ name?: MaybeString } | null> | null;
  game?: MaybeString;
  players?: MaybeString[] | null;
  corrections?: Array<{
    kind?: MaybeString;
    date?: MaybeString;
    text?: MaybeString;
  } | null> | null;
  editorsNote?: MaybeString;
};

const present = <T>(values: Array<T | null | undefined> | null | undefined) =>
  (values ?? []).filter((value): value is T => value != null && value !== "");

function sameAs(socialLinks: Record<string, MaybeString> | null | undefined) {
  const links = Object.values(socialLinks ?? {}).filter(
    (url): url is string => typeof url === "string" && url.startsWith("http"),
  );
  return links.length > 0 ? links : undefined;
}

export function buildArticleAuthor(
  author: ArticleAuthorInput,
  baseUrl: string,
): Person {
  const knowsAbout = present(author?.knowsAbout);
  return {
    "@type": "Person",
    name: author?.name ?? undefined,
    url: author?.slug ? `${baseUrl}/people/${author.slug}` : undefined,
    sameAs: sameAs(author?.socialLinks),
    jobTitle: present(author?.roles)[0],
    description: author?.biography ?? undefined,
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
  };
}

/** The teams and the game the article covers. */
export function buildArticleAbout(
  article: ArticleEntityInput,
  baseUrl: string,
): Thing[] {
  const sport = article.sport?.title ?? undefined;
  const teams: SportsTeam[] = present(article.teams)
    .filter((team) => team.name)
    .map((team) => ({
      "@type": "SportsTeam",
      name: team.name as string,
      ...(team.slug ? { url: `${baseUrl}/college/teams/${team.slug}` } : {}),
      ...(sport ? { sport } : {}),
    }));
  const game = parseExternalRef(article.game);
  const events: SportsEvent[] = game
    ? [
        {
          "@type": "SportsEvent",
          name: game.label,
          identifier: `${game.provider}:${game.id}`,
          ...(sport ? { sport } : {}),
        },
      ]
    : [];
  return [...events, ...teams];
}

/** Conferences and players the article discusses. */
export function buildArticleMentions(article: ArticleEntityInput): Thing[] {
  const conferences: SportsOrganization[] = present(article.conferences)
    .filter((conference) => conference.name)
    .map((conference) => ({
      "@type": "SportsOrganization",
      name: conference.name as string,
    }));
  const players: Person[] = present(article.players).flatMap((value) => {
    const player = parseExternalRef(value);
    if (!player) return [];
    // The label is "Name · Team"; the name is the part before the dot.
    const name = player.label.replace(/ · .*$/, "");
    return [
      {
        "@type": "Person",
        name,
        identifier: `${player.provider}:${player.id}`,
      },
    ];
  });
  return [...conferences, ...players];
}

/** The correction log, as schema.org CorrectionComment entries. */
export function buildArticleCorrections(
  article: ArticleEntityInput,
): CorrectionComment[] {
  return present(article.corrections)
    .filter((correction) => correction.text)
    .map((correction) => ({
      "@type": "CorrectionComment",
      text: correction.text as string,
      ...(correction.date ? { datePublished: correction.date } : {}),
    }));
}
