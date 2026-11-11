import {
  type ExternalProvider,
  formatExternalRef,
} from "@redshirt-sports/sanity/external-refs";

/**
 * Turn provider responses into picker options. Pure, so they're tested
 * without a network; the fetches live in schemaTypes/definitions/external-refs.
 */

export type PickerOption = { value: string; label: string };

/** A game from the site's /api/v1/college/games endpoint (Postgres `games`). */
export type GameSearchResult = {
  provider: ExternalProvider;
  id: string;
  sport: string;
  homeName: string;
  awayName: string;
  neutralSite: boolean;
  kickoffAt: string | null;
};

const kickoffFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
});

export function gameLabel(game: GameSearchResult): string {
  const matchup = `${game.awayName} ${game.neutralSite ? "vs." : "at"} ${game.homeName}`;
  return game.kickoffAt
    ? `${matchup} · ${kickoffFormat.format(new Date(game.kickoffAt))}`
    : matchup;
}

export function gameOptions(games: GameSearchResult[]): PickerOption[] {
  return games.map((game) => {
    const label = gameLabel(game);
    return {
      value: formatExternalRef({ provider: game.provider, id: game.id, label }),
      label,
    };
  });
}

/** ESPN league ids for the college sports we cover (from a result's `uid`). */
const COLLEGE_LEAGUES: Record<string, string> = {
  "23": "College Football",
  "41": "Men's College Basketball",
  "54": "Women's College Basketball",
};

type EspnSearchContent = {
  displayName?: string;
  subtitle?: string;
  uid?: string;
};

type EspnSearchResponse = {
  results?: Array<{ type?: string; contents?: EspnSearchContent[] }>;
};

/**
 * College players from ESPN's search API. A player's ESPN id stays the same
 * when they transfer, so the stored id keeps pointing at the right person.
 */
export function playerOptions(response: EspnSearchResponse): PickerOption[] {
  const players = (response.results ?? [])
    .filter((group) => group.type === "player")
    .flatMap((group) => group.contents ?? []);

  return players.flatMap((player) => {
    const league = player.uid?.match(/~l:(\d+)~/)?.[1];
    const id = player.uid?.match(/~a:(\d+)$/)?.[1];
    if (!league || !id || !COLLEGE_LEAGUES[league] || !player.displayName) {
      return [];
    }
    const label = player.subtitle
      ? `${player.displayName} · ${player.subtitle}`
      : player.displayName;
    return [
      {
        value: formatExternalRef({ provider: "espn", id, label }),
        label: `${label} (${COLLEGE_LEAGUES[league]})`,
      },
    ];
  });
}
