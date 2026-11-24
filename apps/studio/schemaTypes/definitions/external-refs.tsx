import {
  type ExternalProvider,
  externalKey,
  type PlayerTag,
  parseExternalRef,
} from "@redshirt-sports/sanity/external-refs";
import { createAsyncListInput } from "@sanity/sanity-plugin-async-list";
import { useEffect } from "react";
import {
  defineField,
  defineType,
  type ObjectInputProps,
  set,
  unset,
} from "sanity";

import { env } from "@/env";
import {
  type GameSearchResult,
  gameOptions,
  type PickerOption,
  type PortalPlayerSearchResult,
  playerOptions,
  portalPlayerOptions,
} from "@/utils/external-pickers";

/**
 * Games and players live with the data providers, never in Sanity (see
 * packages/sanity/src/external-refs.ts). These string types store the
 * provider id plus a label snapshot, chosen from a live search.
 */

const showLabel = (value: string, option?: PickerOption) =>
  option?.label ?? parseExternalRef(value)?.label ?? value;

const externalRefRule = (kind: string) => (value: string | undefined) =>
  !value || parseExternalRef(value)
    ? true
    : `This ${kind} isn't in the expected format. Clear it and pick it again from the list.`;

export const gameRef = defineType({
  name: "gameRef",
  title: "Game",
  type: "string",
  components: {
    input: createAsyncListInput<PickerOption>({
      loaderType: "search",
      loader: async ({ query }) => {
        if (!query || query.trim().length < 3) return [];
        const url = new URL(
          "/api/v1/college/games",
          env.SANITY_STUDIO_PRESENTATION_URL,
        );
        url.searchParams.set("q", query.trim());
        const response = await fetch(url);
        if (!response.ok) return [];
        const { games } = (await response.json()) as {
          games: GameSearchResult[];
        };
        return gameOptions(games);
      },
      autocompleteProps: {
        placeholder: "Type a team, e.g. Montana",
        renderOption: (option) => (
          <div style={{ padding: 8 }}>{option.label}</div>
        ),
        renderValue: showLabel,
      },
    }),
  },
  validation: (rule) => rule.custom(externalRefRule("game")),
});

export async function searchPortalPlayers(
  query: string,
): Promise<PickerOption[]> {
  try {
    const url = new URL(
      "/api/v1/players/search",
      env.SANITY_STUDIO_PRESENTATION_URL,
    );
    url.searchParams.set("q", query);
    const response = await fetch(url);
    if (!response.ok) return [];
    const { players } = (await response.json()) as {
      players: PortalPlayerSearchResult[];
    };
    return portalPlayerOptions(players);
  } catch {
    return [];
  }
}

export async function searchEspnPlayers(
  query: string,
): Promise<PickerOption[]> {
  try {
    const url = new URL("https://site.web.api.espn.com/apis/search/v2");
    url.searchParams.set("query", query);
    url.searchParams.set("type", "player");
    url.searchParams.set("limit", "20");
    const response = await fetch(url);
    if (!response.ok) return [];
    return playerOptions(await response.json());
  } catch {
    return [];
  }
}

/**
 * Keeps `key` equal to the provider and id in `ref`, so the player page's
 * exact-match lookup finds the article. Only patches when they differ.
 */
function PlayerTagInput(props: ObjectInputProps<PlayerTag>) {
  const { value, onChange } = props;
  const parsed = parseExternalRef(value?.ref);
  const want = parsed ? externalKey(parsed) : undefined;
  const have = value?.key ?? undefined;
  useEffect(() => {
    if (want === have) return;
    onChange(want ? set(want, ["key"]) : unset(["key"]));
  }, [want, have, onChange]);
  return props.renderDefault(props);
}

const playerSearchInput = createAsyncListInput<PickerOption>({
  loaderType: "search",
  loader: async ({ query }) => {
    if (!query || query.trim().length < 3) return [];
    // Our transfer portal players first (they have a page on the site),
    // then ESPN's. Either search failing still leaves the other.
    const [portal, espn] = await Promise.all([
      searchPortalPlayers(query.trim()),
      searchEspnPlayers(query.trim()),
    ]);
    return [...portal, ...espn];
  },
  autocompleteProps: {
    placeholder: "Type a player's name",
    renderOption: (option) => <div style={{ padding: 8 }}>{option.label}</div>,
    renderValue: showLabel,
  },
});

const PROVIDER_NAMES: Record<ExternalProvider, string> = {
  espn: "ESPN",
  ncaa: "NCAA",
  redshirt: "Redshirt player page",
};

/**
 * A player an article is about: `ref` is what the editor picked, `key` the
 * same provider and id without the label (see `PlayerTag`).
 */
export const playerRef = defineType({
  name: "playerRef",
  title: "Player",
  type: "object",
  fields: [
    defineField({
      name: "ref",
      title: "Player",
      type: "string",
      components: { input: playerSearchInput },
      validation: (rule) => rule.required().custom(externalRefRule("player")),
    }),
    defineField({
      name: "key",
      title: "Key",
      type: "string",
      hidden: true,
      readOnly: true,
    }),
  ],
  components: { input: PlayerTagInput },
  preview: {
    select: { ref: "ref" },
    prepare: ({ ref }: { ref?: string }) => {
      const parsed = parseExternalRef(ref);
      return {
        title: parsed?.label ?? ref ?? "No player picked",
        subtitle: parsed ? PROVIDER_NAMES[parsed.provider] : undefined,
      };
    },
  },
});
